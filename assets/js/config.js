export function getDefaultConfig() {
    return {
        skillsConfig: {
            categories: [
                { id: 'programming', file: 'programming.json', order: 1 },
                { id: 'systems',     file: 'systems.json',     order: 2 },
                { id: 'security',    file: 'security.json',    order: 3 },
                { id: 'web',         file: 'web.json',         order: 4 },
                { id: 'tools',       file: 'tools.json',       order: 5 },
                { id: 'leadership',  file: 'leadership.json',  order: 6 },
            ]
        }
    };
}
