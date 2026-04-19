import { escapeHtml, escapeAttr } from './utils.js';
import { getDefaultConfig } from './config.js';

export function renderSkills(container, skillsData, config) {
    if (!container) return;
    container.innerHTML = '';
    const categories = config.skillsConfig?.categories ?? getDefaultConfig().skillsConfig.categories;
    categories
        .slice()
        .sort((a, b) => a.order - b.order)
        .forEach((categoryConfig, index) => {
            const skillData = skillsData[categoryConfig.id];
            if (skillData) container.appendChild(createSkillCategoryElement(skillData, index));
        });
}

export function createSkillCategoryElement(skillData, index) {
    const el = document.createElement('div');
    el.className = 'skill-category loading-animation';
    el.style.animationDelay = `${index * 0.1}s`;
    el.dataset.categoryId = skillData.id;
    el.innerHTML = `
        <div class="category-header">
            <div class="category-icon" style="background: linear-gradient(135deg, ${escapeAttr(skillData.color ?? '#4facfe')} 0%, #00f2fe 100%)">
                <i class="${escapeAttr(skillData.icon ?? 'fas fa-circle')}"></i>
            </div>
            <div class="category-content">
                <div class="category-title">${escapeHtml(skillData.title)}</div>
                ${skillData.description ? `<p class="category-description">${escapeHtml(skillData.description)}</p>` : ''}
            </div>
        </div>
        <div class="skills-list">${createSkillsList(skillData.skills)}</div>
        <div class="category-stats">
            <span class="skills-count">${skillData.skills?.length ?? 0} competenze</span>
            <span class="experience-total">${skillData.totalExperience ? escapeHtml(skillData.totalExperience) : ''}</span>
        </div>
    `;
    return el;
}

function createSkillsList(skills) {
    if (!Array.isArray(skills)) return '';
    return skills.map(skill => {
        const isDetailed = typeof skill === 'object';
        const name       = escapeHtml(isDetailed ? skill.name : skill);
        const level      = isDetailed && skill.level      ? escapeHtml(skill.level)      : '';
        const experience = isDetailed && skill.experience ? escapeHtml(skill.experience) : '';
        return `<span class="skill-tag ${isDetailed ? 'detailed-skill' : ''}"
                      role="button" tabindex="0"
                      data-skill-name="${name}"
                      data-level="${level}"
                      data-experience="${experience}"
                      title="${level ? `${level}${experience ? ' · ' + experience : ''}` : name}"
                      aria-label="Competenza: ${name}${level ? ', livello ' + level : ''}">
                    ${name}${level ? `<small class="skill-level">${level}</small>` : ''}
                </span>`;
    }).join('');
}
