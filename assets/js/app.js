import { loadConfig, loadAllSkills } from './loader.js';
import { renderSkills } from './renderer.js';
import { initAnimations, initInteractions } from './interactions.js';

async function init() {
    const config     = await loadConfig();
    const skillsData = await loadAllSkills(config);
    const container  = document.getElementById('skillsContainer');
    renderSkills(container, skillsData, config);
    initAnimations();
    initInteractions(skillsData);
}

document.addEventListener('DOMContentLoaded', () => { init(); });
