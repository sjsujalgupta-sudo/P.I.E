using System;
using System.Diagnostics;
using System.IO;
using System.Net.Sockets;
using System.Threading;

namespace DataVaultLauncher
{
    internal static class Program
    {
        private const string AppUrl = "http://localhost:3000";

        private static void Main(string[] args)
        {
            string projectRoot = FindProjectRoot();
            string frontendDir = Path.Combine(projectRoot, "data-vault-frontend");
            string backendDir = Path.Combine(projectRoot, "knowledge-vault-backend");

            Console.Title = "DataVault One-Click Launcher";
            Console.WriteLine("DataVault One-Click Launcher");
            Console.WriteLine("===========================");
            Console.WriteLine("Project: " + projectRoot);
            Console.WriteLine();

            if (args.Length > 0 && args[0] == "--check")
            {
                Console.WriteLine("Frontend folder: " + (Directory.Exists(frontendDir) ? "OK" : "MISSING"));
                Console.WriteLine("Backend folder: " + (Directory.Exists(backendDir) ? "OK" : "MISSING"));
                Console.WriteLine("node: " + (CommandExists("node") ? "OK" : "MISSING"));
                Console.WriteLine("npm: " + (CommandExists("npm") ? "OK" : "MISSING"));
                return;
            }

            if (!Directory.Exists(frontendDir) || !Directory.Exists(backendDir))
            {
                Fail("Could not find data-vault-frontend and knowledge-vault-backend beside this launcher.");
                return;
            }

            if (!CommandExists("node") || !CommandExists("npm"))
            {
                Fail("Node.js and npm are required. Install Node.js LTS from https://nodejs.org, then run this launcher again.");
                return;
            }

            EnsureDependencies("backend", backendDir);
            EnsureDependencies("frontend", frontendDir);

            Process backend = StartNpm("backend", backendDir, "run start", Path.Combine(projectRoot, "backend-launch.log"));
            Process frontend = StartNpm("frontend", frontendDir, "run dev", Path.Combine(projectRoot, "frontend-launch.log"));

            Console.WriteLine("Backend and frontend are starting in the background.");
            Console.WriteLine("Logs:");
            Console.WriteLine("  " + Path.Combine(projectRoot, "backend-launch.log"));
            Console.WriteLine("  " + Path.Combine(projectRoot, "frontend-launch.log"));
            Console.WriteLine();
            Console.WriteLine("Waiting for the frontend, then opening the browser...");

            WaitForPort("localhost", 3000, TimeSpan.FromSeconds(60));
            OpenBrowser(AppUrl);

            Console.WriteLine();
            Console.WriteLine("Opened " + AppUrl);
            Console.WriteLine("Keep this launcher window open while using DataVault.");
            Console.WriteLine("Press Q, then Enter, to stop the project.");

            while (true)
            {
                string input = Console.ReadLine() ?? "";
                if (input.Trim().Equals("q", StringComparison.OrdinalIgnoreCase))
                {
                    StopProcess(frontend);
                    StopProcess(backend);
                    return;
                }
            }
        }

        private static void EnsureDependencies(string name, string workingDirectory)
        {
            if (Directory.Exists(Path.Combine(workingDirectory, "node_modules")))
            {
                return;
            }

            Console.WriteLine("Installing " + name + " dependencies. This can take a few minutes on first run...");
            int exitCode = RunNpm(workingDirectory, "install");
            if (exitCode != 0)
            {
                Fail("npm install failed for " + name + ". Check your internet connection and try again.");
                Environment.Exit(exitCode);
            }
        }

        private static int RunNpm(string workingDirectory, string arguments)
        {
            Process process = Process.Start(new ProcessStartInfo
            {
                FileName = "cmd.exe",
                Arguments = "/c npm " + arguments,
                WorkingDirectory = workingDirectory,
                UseShellExecute = false,
                RedirectStandardOutput = true,
                RedirectStandardError = true
            });

            if (process == null)
            {
                return 1;
            }

            process.WaitForExit();
            return process.ExitCode;
        }

        private static Process StartNpm(string name, string workingDirectory, string arguments, string logPath)
        {
            try
            {
                File.WriteAllText(logPath, "Starting " + name + " with npm " + arguments + Environment.NewLine);
            }
            catch (IOException)
            {
                // Best effort write, ignore if locked by an orphaned process
            }

            Process process = Process.Start(new ProcessStartInfo
            {
                FileName = "cmd.exe",
                Arguments = "/c npm " + arguments + " >> \"" + logPath + "\" 2>&1",
                WorkingDirectory = workingDirectory,
                UseShellExecute = false,
                CreateNoWindow = true
            });

            if (process == null)
            {
                Fail("Could not start " + name + ".");
                Environment.Exit(1);
            }

            return process;
        }

        private static void StopProcess(Process process)
        {
            try
            {
                if (!process.HasExited)
                {
                    Process t = Process.Start(new ProcessStartInfo
                    {
                        FileName = "taskkill.exe",
                        Arguments = "/t /f /pid " + process.Id,
                        CreateNoWindow = true,
                        UseShellExecute = false
                    });
                    if (t != null)
                    {
                        t.WaitForExit();
                    }
                }
            }
            catch
            {
                // Best-effort shutdown.
            }
        }

        private static string FindProjectRoot()
        {
            DirectoryInfo current = new DirectoryInfo(AppDomain.CurrentDomain.BaseDirectory);
            while (current != null)
            {
                if (Directory.Exists(Path.Combine(current.FullName, "data-vault-frontend")) &&
                    Directory.Exists(Path.Combine(current.FullName, "knowledge-vault-backend")))
                {
                    return current.FullName.TrimEnd(Path.DirectorySeparatorChar);
                }

                current = current.Parent;
            }

            const string defaultRoot = @"D:\Personal-Data-Vault-Projects";
            return Directory.Exists(defaultRoot)
                ? defaultRoot
                : AppDomain.CurrentDomain.BaseDirectory.TrimEnd(Path.DirectorySeparatorChar);
        }

        private static bool CommandExists(string command)
        {
            try
            {
                Process process = Process.Start(new ProcessStartInfo
                {
                    FileName = "cmd.exe",
                    Arguments = "/c where " + command,
                    CreateNoWindow = true,
                    UseShellExecute = false,
                    RedirectStandardOutput = true,
                    RedirectStandardError = true
                });

                if (process == null)
                {
                    return false;
                }

                process.WaitForExit(5000);
                return process.ExitCode == 0;
            }
            catch
            {
                return false;
            }
        }

        private static void WaitForPort(string host, int port, TimeSpan timeout)
        {
            DateTime deadline = DateTime.UtcNow + timeout;
            while (DateTime.UtcNow < deadline)
            {
                try
                {
                    using (TcpClient client = new TcpClient())
                    {
                        IAsyncResult result = client.BeginConnect(host, port, null, null);
                        bool success = result.AsyncWaitHandle.WaitOne(TimeSpan.FromSeconds(1));
                        if (success)
                        {
                            client.EndConnect(result);
                            return;
                        }
                    }
                }
                catch
                {
                    // The server is still starting.
                }

                Thread.Sleep(1000);
            }

            Fail("Frontend failed to start within 60 seconds. Check the logs for details.");
        }

        private static void OpenBrowser(string url)
        {
            try
            {
                Process.Start(new ProcessStartInfo
                {
                    FileName = "cmd.exe",
                    Arguments = "/c start " + url,
                    UseShellExecute = true,
                    CreateNoWindow = true
                });
            }
            catch (Exception ex)
            {
                Console.WriteLine("Warning: Could not open browser automatically. Navigate to " + url + " manually.");
                Console.WriteLine("Error: " + ex.Message);
            }
        }

        private static void Fail(string message)
        {
            Console.ForegroundColor = ConsoleColor.Red;
            Console.WriteLine(message);
            Console.ResetColor();
            Console.WriteLine();
            Console.WriteLine("Press any key to close.");
            Console.ReadKey(true);
        }
    }
}
