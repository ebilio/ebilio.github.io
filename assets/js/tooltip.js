export function showSkillTooltip(anchorElement, skillName) {
    document.querySelector('.skill-tooltip')?.remove();
    const tooltip = document.createElement('div');
    tooltip.className = 'skill-tooltip';
    tooltip.setAttribute('role', 'tooltip');
    tooltip.textContent = skillName;
    tooltip.style.cssText = 'opacity:0;transform:translateY(-6px);transition:opacity .2s,transform .2s;';
    document.body.appendChild(tooltip);
    const rect = anchorElement.getBoundingClientRect();
    tooltip.style.left = `${Math.max(8, rect.left + rect.width / 2 - tooltip.offsetWidth / 2 + window.scrollX)}px`;
    tooltip.style.top  = `${rect.top + window.scrollY - tooltip.offsetHeight - 10}px`;
    requestAnimationFrame(() => { tooltip.style.opacity = '1'; tooltip.style.transform = 'translateY(0)'; });
    setTimeout(() => {
        tooltip.style.opacity = '0';
        tooltip.addEventListener('transitionend', () => tooltip.remove(), { once: true });
    }, 2500);
}
