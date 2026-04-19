import { escapeHtml, escapeAttr } from './utils.js';

export function openSkillModal(skillDetails, categoryTitle) {
    closeModal();
    const modal = document.createElement('div');
    modal.className = 'skill-modal';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.setAttribute('aria-label', `Dettagli: ${skillDetails.name}`);
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3>${escapeHtml(skillDetails.name)}</h3>
                <button class="close-modal" aria-label="Chiudi">&times;</button>
            </div>
            <div class="modal-body">
                <div class="skill-meta">
                    <span class="skill-category-badge">${escapeHtml(categoryTitle)}</span>
                    ${skillDetails.level      ? `<span class="skill-level level-${escapeAttr(skillDetails.level.toLowerCase())}">${escapeHtml(skillDetails.level)}</span>` : ''}
                    ${skillDetails.experience ? `<span class="skill-experience">${escapeHtml(skillDetails.experience)}</span>` : ''}
                </div>
                ${skillDetails.description ? `<p class="skill-description">${escapeHtml(skillDetails.description)}</p>` : ''}
                ${renderSkillProjects(skillDetails.projects)}
                ${renderSkillCertifications(skillDetails.certifications)}
            </div>
        </div>`;
    document.body.appendChild(modal);
    modal.querySelector('.close-modal').addEventListener('click', () => closeModal());
    document.body.style.overflow = 'hidden';
    requestAnimationFrame(() => modal.classList.add('active'));
    modal.querySelector('.close-modal').focus();
}

export function closeModal() {
    const modal = document.querySelector('.skill-modal');
    if (!modal) return;
    modal.classList.remove('active');
    document.body.style.overflow = '';
    modal.addEventListener('transitionend', () => modal.remove(), { once: true });
}

function renderSkillProjects(projects) {
    if (!projects?.length) return '';
    return `<div class="skill-projects"><h4><i class="fas fa-project-diagram"></i> Progetti</h4><ul>${projects.map(p => `<li>${escapeHtml(p)}</li>`).join('')}</ul></div>`;
}

function renderSkillCertifications(certifications) {
    if (!certifications?.length) return '';
    return `<div class="skill-certifications"><h4><i class="fas fa-certificate"></i> Certificazioni</h4><ul>${certifications.map(c => `<li>${escapeHtml(c)}</li>`).join('')}</ul></div>`;
}
