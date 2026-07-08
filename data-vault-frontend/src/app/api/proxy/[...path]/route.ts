import { NextRequest } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:4000";

async function handleProxy(request: NextRequest, path: string[]) {
    const incomingUrl = new URL(request.url);
    const targetPath = path.join("/");
    const targetUrl = `${BACKEND_URL.replace(/\/$/, "")}/${targetPath}${incomingUrl.search}`;

    const headers = new Headers(request.headers);
    headers.delete("host");

    const method = request.method.toUpperCase();
    const canHaveBody = method !== "GET" && method !== "HEAD";

    try {
        const response = await fetch(targetUrl, {
            method,
            headers,
            body: canHaveBody ? await request.arrayBuffer() : undefined,
            redirect: "manual",
            cache: "no-store",
        });

        return new Response(response.body, {
            status: response.status,
            statusText: response.statusText,
            headers: response.headers,
        });
    } catch {
        return Response.json(
            { error: "Server offline", message: "Unable to reach backend server." },
            { status: 503 }
        );
    }
}

type RouteContext = {
    params: Promise<{ path: string[] }>;
};

export async function GET(request: NextRequest, context: RouteContext) {
    const { path } = await context.params;
    return handleProxy(request, path);
}

export async function POST(request: NextRequest, context: RouteContext) {
    const { path } = await context.params;
    return handleProxy(request, path);
}

export async function PUT(request: NextRequest, context: RouteContext) {
    const { path } = await context.params;
    return handleProxy(request, path);
}

export async function PATCH(request: NextRequest, context: RouteContext) {
    const { path } = await context.params;
    return handleProxy(request, path);
}

export async function DELETE(request: NextRequest, context: RouteContext) {
    const { path } = await context.params;
    return handleProxy(request, path);
}

export async function OPTIONS(request: NextRequest, context: RouteContext) {
    const { path } = await context.params;
    return handleProxy(request, path);
}
