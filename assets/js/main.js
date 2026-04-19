/**
 * Portfolio App — main.js
 * Unica implementazione di PortfolioApp.
 * Non duplicare questa classe in index.html.
 */

class PortfolioApp {
    constructor() {
        this.skillsData = {};
        this.config = {};
        this.init();
    }

    async init() {
        try {
            await this.loadConfig();
            await this.loadAllSkills();
            this.renderSkills();
            this.initAnimations();
            this.initInteractions();
        } catch (error) {
            console.error('Errore inizializzazione portfolio:', error);
            this.fallbackToStaticData();
        }
    }

    async loadConfig() {
        try {
            const response = await fetch('./skills/config.json');
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            this.config = await response.json();
        } catch {
            console.warn('config.json non trovato, uso configurazione predefinita.');
            this.config = this.getDefaultConfig();
        }
    }

    getDefaultConfig() {
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

    async loadAllSkills() {
        const categories = this.config.skillsConfig?.categories ?? this.getDefaultConfig().skillsConfig.categories;
        for (const category of categories) {
            try {
                const response = await fetch(`./skills/${category.file}`);
                if (!response.ok) throw new Error(`HTTP ${response.status}`);
                this.skillsData[category.id] = await response.json();
            } catch (error) {
                console.warn(`Impossibile caricare ${category.file}:`, error.message);
                this.skillsData[category.id] = this.getFallbackData(category.id);
            }
        }
    }

    getFallbackData(categoryId) {
        const fallback = {
            programming: { id: 'programming', title: 'Linguaggi di Programmazione', icon: 'fas fa-code',    color: '#4facfe', skills: ['Java', 'Python', 'JavaScript', 'SQL', 'HTML', 'CSS'] },
            systems:     { id: 'systems',     title: 'Sistemi Operativi',           icon: 'fas fa-desktop', color: '#00f2fe', skills: ['Windows', 'Linux Ubuntu', 'Kali Linux', 'Debian'] },
        };
        return fallback[categoryId] ?? { id: categoryId, title: categoryId, skills: [] };
    }

    renderSkills() {
        const container = document.getElementById('skillsContainer');
        if (!container) return;
        container.innerHTML = '';
        const categories = this.config.skillsConfig?.categories ?? this.getDefaultConfig().skillsConfig.categories;
        categories
            .slice()
            .sort((a, b) => a.order - b.order)
            .forEach((categoryConfig, index) => {
                const skillData = this.skillsData[categoryConfig.id];
                if (skillData) container.appendChild(this.createSkillCategoryElement(skillData, index));
            });
    }

    createSkillCategoryElement(skillData, index) {
        const el = document.createElement('div');
        el.className = 'skill-category loading-animation';
        el.style.animationDelay = `${index * 0.1}s`;
        el.dataset.categoryId = skillData.id;
        el.innerHTML = `
            <div class="category-header">
                <div class="category-icon" style="background: linear-gradient(135deg, ${this.escapeAttr(skillData.color ?? '#4facfe')} 0%, #00f2fe 100%)">
                    <i class="${this.escapeAttr(skillData.icon ?? 'fas fa-circle')}"></i>
                </div>
                <div class="category-content">
                    <div class="category-title">${this.escapeHtml(skillData.title)}</div>
                    ${skillData.description ? `<p class="category-description">${this.escapeHtml(skillData.description)}</p>` : ''}
                </div>
            </div>
            <div class="skills-list">${this.createSkillsList(skillData.skills)}</div>
            <div class="category-stats">
                <span class="skills-count">${skillData.skills?.length ?? 0} competenze</span>
                <span class="experience-total">${skillData.totalExperience ? this.escapeHtml(skillData.totalExperience) : ''}</span>
            </div>
        `;
        return el;
    }

    createSkillsList(skills) {
        if (!Array.isArray(skills)) return '';
        return skills.map(skill => {
            const isDetailed = typeof skill === 'object';
            const name       = this.escapeHtml(isDetailed ? skill.name : skill);
            const level      = isDetailed && skill.level      ? this.escapeHtml(skill.level)      : '';
            const experience = isDetailed && skill.experience ? this.escapeHtml(skill.experience) : '';
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

    initAnimations() {
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

    initInteractions() {
        document.addEventListener('click', e => {
            const tag = e.target.closest('.skill-tag');
            if (tag) this.handleSkillClick(tag);
            if (e.target.classList.contains('skill-modal')) this.closeModal();
        });
        document.addEventListener('keydown', e => {
            if (e.key === 'Escape') this.closeModal();
            if ((e.key === 'Enter' || e.key === ' ') && e.target.classList.contains('skill-tag')) {
                e.preventDefault();
                this.handleSkillClick(e.target);
            }
        });
    }

    handleSkillClick(skillElement) {
        const skillName   = skillElement.dataset.skillName;
        const categoryEl  = skillElement.closest('.skill-category');
        if (!categoryEl) return;
        const categoryData = this.skillsData[categoryEl.dataset.categoryId];
        const skillDetails = categoryData?.skills?.find(s =>
            (typeof s === 'object' ? s.name : s) === skillName
        );
        if (skillDetails && typeof skillDetails === 'object') {
            this.openSkillModal(skillDetails, categoryData.title);
        } else {
            this.showSkillTooltip(skillElement, skillName);
        }
    }

    openSkillModal(skillDetails, categoryTitle) {
        this.closeModal();
        const modal = document.createElement('div');
        modal.className = 'skill-modal';
        modal.setAttribute('role', 'dialog');
        modal.setAttribute('aria-modal', 'true');
        modal.setAttribute('aria-label', `Dettagli: ${skillDetails.name}`);
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>${this.escapeHtml(skillDetails.name)}</h3>
                    <button class="close-modal" aria-label="Chiudi">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="skill-meta">
                        <span class="skill-category-badge">${this.escapeHtml(categoryTitle)}</span>
                        ${skillDetails.level      ? `<span class="skill-level level-${this.escapeAttr(skillDetails.level.toLowerCase())}">${this.escapeHtml(skillDetails.level)}</span>` : ''}
                        ${skillDetails.experience ? `<span class="skill-experience">${this.escapeHtml(skillDetails.experience)}</span>` : ''}
                    </div>
                    ${skillDetails.description ? `<p class="skill-description">${this.escapeHtml(skillDetails.description)}</p>` : ''}
                    ${this.renderSkillProjects(skillDetails.projects)}
                    ${this.renderSkillCertifications(skillDetails.certifications)}
                </div>
            </div>`;
        document.body.appendChild(modal);
        modal.querySelector('.close-modal').addEventListener('click', () => this.closeModal());
        document.body.style.overflow = 'hidden';
        requestAnimationFrame(() => modal.classList.add('active'));
        modal.querySelector('.close-modal').focus();
    }

    closeModal() {
        const modal = document.querySelector('.skill-modal');
        if (!modal) return;
        modal.classList.remove('active');
        document.body.style.overflow = '';
        modal.addEventListener('transitionend', () => modal.remove(), { once: true });
    }

    renderSkillProjects(projects) {
        if (!projects?.length) return '';
        return `<div class="skill-projects"><h4><i class="fas fa-project-diagram"></i> Progetti</h4><ul>${projects.map(p => `<li>${this.escapeHtml(p)}</li>`).join('')}</ul></div>`;
    }

    renderSkillCertifications(certifications) {
        if (!certifications?.length) return '';
        return `<div class="skill-certifications"><h4><i class="fas fa-certificate"></i> Certificazioni</h4><ul>${certifications.map(c => `<li>${this.escapeHtml(c)}</li>`).join('')}</ul></div>`;
    }

    showSkillTooltip(anchorElement, skillName) {
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

    fallbackToStaticData() {
        ['programming', 'systems'].forEach(id => { this.skillsData[id] = this.getFallbackData(id); });
        this.renderSkills();
    }

    exportToJSON() {
        const a = Object.assign(document.createElement('a'), {
            href: 'data:application/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(this.skillsData, null, 2)),
            download: `portfolio-skills-${new Date().toISOString().split('T')[0]}.json`
        });
        a.click();
    }

    escapeHtml(str) {
        return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;');
    }

    escapeAttr(str) {
        return String(str).replace(/"/g,'&quot;').replace(/'/g,'&#039;');
    }
}

document.addEventListener('DOMContentLoaded', () => { window.portfolioApp = new PortfolioApp(); });
