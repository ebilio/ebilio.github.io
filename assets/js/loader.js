import { getDefaultConfig } from './config.js';

export async function loadConfig() {
    try {
        const response = await fetch('./skills/config.json');
        if (!response.ok) throw new Error();
        return await response.json();
    } catch {
        return getDefaultConfig();
    }
}

export async function loadAllSkills(config) {
    const skillsData = {};
    const categories = config.skillsConfig?.categories ?? getDefaultConfig().skillsConfig.categories;
    for (const category of categories) {
        try {
            const response = await fetch(`./skills/${category.file}`);
            if (!response.ok) throw new Error();
            skillsData[category.id] = await response.json();
        } catch {
            skillsData[category.id] = getFallbackData(category.id);
        }
    }
    return skillsData;
}

export function getFallbackData(categoryId) {
    const fallback = {
        programming: { id: 'programming', title: 'Linguaggi di Programmazione', icon: 'fas fa-code',    color: '#4facfe', skills: ['Java', 'Python', 'JavaScript', 'SQL', 'HTML', 'CSS'] },
        systems:     { id: 'systems',     title: 'Sistemi Operativi',           icon: 'fas fa-desktop', color: '#00f2fe', skills: ['Windows', 'Linux Ubuntu', 'Kali Linux', 'Debian'] },
    };
    return fallback[categoryId] ?? { id: categoryId, title: categoryId, skills: [] };
}
