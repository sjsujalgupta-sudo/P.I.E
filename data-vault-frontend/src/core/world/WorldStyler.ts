import { WorldGraph, Domain, LayoutProfile } from './Contracts';

export class WorldStyler {
    
    public static style(world: WorldGraph): WorldGraph {
        // We style domains by giving them continuous profiles based on their semantic identity or size
        world.domains.forEach(domain => {
            domain.layoutProfile = this.getProfileForDomain(domain);
            
            // Districts can inherit or slightly vary the domain profile
            domain.districts.forEach(district => {
                district.layoutProfile = {
                    ...domain.layoutProfile!,
                    // slightly higher density in specific districts (like documents)
                    density: district.name === 'Document' ? Math.min(1, domain.layoutProfile!.density + 0.2) : domain.layoutProfile!.density
                };
            });
        });
        
        return world;
    }
    
    private static getProfileForDomain(domain: Domain): LayoutProfile {
        // By using continuous profiles, the LayoutEngine will interpolate 
        // between shapes or math behaviors.
        
        const name = domain.name.toLowerCase();
        
        if (name.includes('programming') || name.includes('tech') || name.includes('code')) {
            // Highly structured, grid-like, dense
            return {
                density: 0.9,
                symmetry: 0.8,
                branching: 0.2,
                clustering: 0.9,
                curvature: 0.1,
                openness: 0.2,
                landmarkWeight: 0.9,
                edgeVisibility: 0.8
            };
        } else if (name.includes('finance') || name.includes('money') || name.includes('business')) {
            // Branching, linear, medium density
            return {
                density: 0.6,
                symmetry: 0.5,
                branching: 0.9,
                clustering: 0.6,
                curvature: 0.3,
                openness: 0.5,
                landmarkWeight: 0.7,
                edgeVisibility: 0.7
            };
        } else if (name.includes('entertainment') || name.includes('media') || name.includes('art')) {
            // Organic, circular/spiral, very open
            return {
                density: 0.4,
                symmetry: 0.9,
                branching: 0.3,
                clustering: 0.4,
                curvature: 0.9,
                openness: 0.8,
                landmarkWeight: 0.6,
                edgeVisibility: 0.5
            };
        }
        
        // Default / General (e.g. Science, Notes)
        // Balanced organic diffuse
        return {
            density: 0.5,
            symmetry: 0.5,
            branching: 0.5,
            clustering: 0.5,
            curvature: 0.5,
            openness: 0.5,
            landmarkWeight: 0.5,
            edgeVisibility: 0.5
        };
    }
}
