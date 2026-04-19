import { openSkillModal, closeModal } from './modal.js';
import { showSkillTooltip } from './tooltip.js';

export function initAnimations() {
    const observer = new IntersectionObserver(
        entries => entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        }),
        { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
    );
    document.querySelectorAll('.loading-animation').forEach(el => observer.observe(el));
}

export function initInteractions(skillsData) {
    document.addEventListener('click', e => {
        const tag = e.target.closest('.skill-tag');
        if (tag) handleSkillClick(tag, skillsData);
        if (e.target.classList.contains('skill-modal')) closeModal();
    });
    document.addEventListener('keydown', e => {
        if (e.key === 'Escape') closeModal();
        if ((e.key === 'Enter' || e.key === ' ') && e.target.classList.contains('skill-tag')) {
            e.preventDefault();
            handleSkillClick(e.target, skillsData);
        }
    });
}

function handleSkillClick(skillElement, skillsData) {
    const skillName  = skillElement.dataset.skillName;
    const categoryEl = skillElement.closest('.skill-category');
    if (!categoryEl) return;
    const categoryData = skillsData[categoryEl.dataset.categoryId];
    const skillDetails = categoryData?.skills?.find(s =>
        (typeof s === 'object' ? s.name : s) === skillName
    );
    if (skillDetails && typeof skillDetails === 'object') {
        openSkillModal(skillDetails, categoryData.title);
    } else {
        showSkillTooltip(skillElement, skillName);
    }
}
