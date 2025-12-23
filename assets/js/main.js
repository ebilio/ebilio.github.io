// Portfolio Web App - Main JavaScript
// Caricamento dinamico competenze da file JSON modulari

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
            console.log('Portfolio app initialized successfully');
        } catch (error) {
            console.error('Error initializing portfolio app:', error);
            this.fallbackToStaticData();
        }
    }

    async loadConfig() {
        try {
            const response = await fetch('./skills/config.json');
            this.config = await response.json();
        } catch (error) {
            console.warn('Config not found, using default configuration');
            this.config = this.getDefaultConfig();
        }
    }

    async loadAllSkills() {
        const categories = this.config.skillsConfig?.categories || this.getDefaultCategories();
        
        for (const category of categories) {
            try {
                const response = await fetch(`./skills/${category.file}`);
                const skillData = await response.json();
                this.skillsData[category.id] = skillData;
            } catch (error) {
                console.warn(`Could not load ${category.file}, using fallback data`);
                this.skillsData[category.id] = this.getFallbackData(category.id);
            }
        }
    }

    renderSkills() {
        const container = document.getElementById('skillsContainer');
        if (!container) return;

        container.innerHTML = '';
        
        const categories = this.config.skillsConfig?.categories || this.getDefaultCategories();
        
        categories
            .sort((a, b) => a.order - b.order)
            .forEach((categoryConfig, index) => {
                const skillData = this.skillsData[categoryConfig.id];
                if (skillData) {
                    const element = this.createSkillCategoryElement(skillData, index);
                    container.appendChild(element);
                }
            });
    }

    createSkillCategoryElement(skillData, index) {
        const skillCategory = document.createElement('div');
        skillCategory.className = 'skill-category loading-animation';
        skillCategory.style.animationDelay = `${index * 0.1}s`;
        skillCategory.dataset.categoryId = skillData.id;

        const skillsList = this.createSkillsList(skillData.skills);
        const description = skillData.description ? `<p class="category-description">${skillData.description}</p>` : '';

        skillCategory.innerHTML = `
            <div class="category-header">
                <div class="category-icon" style="background: linear-gradient(135deg, ${skillData.color || '#4facfe'} 0%, #00f2fe 100%)">
                    <i class="${skillData.icon}"></i>
                </div>
                <div class="category-content">
                    <div class="category-title">${skillData.title}</div>
                    ${description}
                </div>
            </div>
            <div class="skills-list">
                ${skillsList}
            </div>
            <div class="category-stats">
                <span class="skills-count">${skillData.skills?.length || 0} competenze</span>
                <span class="experience-total">${skillData.totalExperience || ''}</span>
            </div>
        `;

        return skillCategory;
    }

    createSkillsList(skills) {
        if (!skills || !Array.isArray(skills)) return '';
        
        return skills.map(skill => {
            const isDetailed = typeof skill === 'object';
            const name = isDetailed ? skill.name : skill;
            const level = isDetailed ? skill.level : '';
            const experience = isDetailed ? skill.experience : '';
            
            return `
                <span class="skill-tag ${isDetailed ? 'detailed-skill' : ''}" 
                      data-skill="${name}"
                      data-level="${level}"
                      data-experience="${experience}"
                      title="${isDetailed ? `${level} - ${experience}` : name}">
                    ${name}
                    ${level ? `<small class="skill-level">${level}</small>` : ''}
                </span>
            `;
        }).join('');
    }

    initAnimations() {
        // Intersection Observer per animazioni scroll
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateY(0)';
                }
            });
        }, {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        });

        document.querySelectorAll('.loading-animation').forEach(el => {
            observer.observe(el);
        });
    }

    initInteractions() {
        // Click handler per skill tags
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('skill-tag')) {
                this.showSkillDetails(e.target);
            }
        });

        // Search functionality
        this.initSearch();
        
        // Filter functionality  
        this.initFilters();
    }

    showSkillDetails(skillElement) {
        const skillName = skillElement.dataset.skill;
        const level = skillElement.dataset.level;
        const experience = skillElement.dataset.experience;
        const categoryId = skillElement.closest('.skill-category').dataset.categoryId;
        
        // Trova i dettagli completi della skill
        const categoryData = this.skillsData[categoryId];
        const skillDetails = categoryData?.skills?.find(s => 
            (typeof s === 'object' ? s.name : s) === skillName
        );

        if (skillDetails && typeof skillDetails === 'object') {
            this.openSkillModal(skillDetails, categoryData.title);
        } else {
            // Fallback per skill semplici
            this.showSimpleSkillInfo(skillName, level, experience);
        }
    }

    openSkillModal(skillDetails, categoryTitle) {
        // Crea modal con dettagli skill
        const modal = document.createElement('div');
        modal.className = 'skill-modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>${skillDetails.name}</h3>
                    <span class="close-modal">&times;</span>
                </div>
                <div class="modal-body">
                    <div class="skill-meta">
                        <span class="skill-category">${categoryTitle}</span>
                        <span class="skill-level level-${skillDetails.level?.toLowerCase()}">${skillDetails.level}</span>
                        <span class="skill-experience">${skillDetails.experience}</span>
                    </div>
                    <p class="skill-description">${skillDetails.description || ''}</p>
                    ${this.renderSkillProjects(skillDetails.projects)}
                    ${this.renderSkillCertifications(skillDetails.certifications)}
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        
        // Event listeners
        modal.querySelector('.close-modal').onclick = () => modal.remove();
        modal.onclick = (e) => {
            if (e.target === modal) modal.remove();
        };

        // Animate modal
        setTimeout(() => modal.classList.add('active'), 10);
    }

    renderSkillProjects(projects) {
        if (!projects || !projects.length) return '';
        
        return `
            <div class="skill-projects">
                <h4>Progetti</h4>
                <ul>
                    ${projects.map(project => `<li>${project}</li>`).join('')}
                </ul>
            </div>
        `;
    }

    renderSkillCertifications(certifications) {
        if (!certifications || !certifications.length) return '';
        
        return `
            <div class="skill-certifications">
                <h4>Certificazioni</h4>
                <ul>
                    ${certifications.map(cert => `<li>${cert}</li>`).join('')}
                </ul>
            </div>
        `;
    }

    showSimpleSkillInfo(skillName, level, experience) {
        // Tooltip semplice per skill base
        const tooltip = document.createElement('div');
        tooltip.className = 'skill-tooltip';
        tooltip.innerHTML = `
            <strong>${skillName}</strong>
            ${level ? `<br>Livello: ${level}` : ''}
            ${experience ? `<br>Esperienza: ${experience}` : ''}
        `;
        
        document.body.appendChild(tooltip);
        setTimeout(() => tooltip.remove(), 3000);
    }

    initSearch() {
        // Aggiungi search box se non esiste
        const searchBox = document.createElement('div');
        searchBox.className = 'search-container';
        searchBox.innerHTML = `
            <input type="text" id="skillSearch" placeholder="Cerca competenze..." />
            <i class="fas fa-search search-icon"></i>
        `;
        
        const header = document.querySelector('.header');
        if (header) {
            header.appendChild(searchBox);
        }

        // Search functionality
        const searchInput = document.getElementById('skillSearch');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => this.filterSkills(e.target.value));
        }
    }

    filterSkills(searchTerm) {
        const categories = document.querySelectorAll('.skill-category');
        const term = searchTerm.toLowerCase();

        categories.forEach(category => {
            const skills = category.querySelectorAll('.skill-tag');
            let hasVisibleSkills = false;

            skills.forEach(skill => {
                const skillName = skill.textContent.toLowerCase();
                const isVisible = skillName.includes(term);
                skill.style.display = isVisible ? '' : 'none';
                if (isVisible) hasVisibleSkills = true;
            });

            category.style.display = hasVisibleSkills || !term ? '' : 'none';
        });
    }

    initFilters() {
        // Level filters
        const filterContainer = document.createElement('div');
        filterContainer.className = 'filter-container';
        filterContainer.innerHTML = `
            <div class="filter-group">
                <label>Filtra per livello:</label>
                <select id="levelFilter">
                    <option value="">Tutti i livelli</option>
                    <option value="base">Base</option>
                    <option value="intermedio">Intermedio</option>
                    <option value="avanzato">Avanzato</option>
                    <option value="esperto">Esperto</option>
                </select>
            </div>
        `;

        const searchContainer = document.querySelector('.search-container');
        if (searchContainer) {
            searchContainer.appendChild(filterContainer);
        }

        // Filter functionality
        const levelFilter = document.getElementById('levelFilter');
        if (levelFilter) {
            levelFilter.addEventListener('change', (e) => this.filterByLevel(e.target.value));
        }
    }

    filterByLevel(level) {
        const skills = document.querySelectorAll('.skill-tag[data-level]');
        
        skills.forEach(skill => {
            const skillLevel = skill.dataset.level.toLowerCase();
            const isVisible = !level || skillLevel.includes(level);
            skill.style.display = isVisible ? '' : 'none';
        });
    }

    // Fallback data per quando i JSON non sono disponibili
    getFallbackData(categoryId) {
        const fallbackData = {
            programming: {
                id: 'programming',
                title: 'Linguaggi di Programmazione',
                icon: 'fas fa-code',
                color: '#4facfe',
                skills: ['JAVA', 'PYTHON', 'XML', 'SQL', 'PHP', 'HTML', 'JAVASCRIPT', 'CSS']
            },
            systems: {
                id: 'systems',
                title: 'Sistemi Operativi e Ambienti',
                icon: 'fas fa-desktop',
                color: '#00f2fe',
                skills: ['Windows', 'Linux Ubuntu', 'Kali Linux', 'Debian']
            }
            // ... altri fallback
        };

        return fallbackData[categoryId] || { id: categoryId, title: categoryId, skills: [] };
    }

    getDefaultConfig() {
        return {
            skillsConfig: {
                categories: [
                    { id: 'programming', file: 'programming.json', order: 1 },
                    { id: 'systems', file: 'systems.json', order: 2 },
                    { id: 'security', file: 'security.json', order: 3 },
                    { id: 'web', file: 'web.json', order: 4 },
                    { id: 'tools', file: 'tools.json', order: 5 },
                    { id: 'leadership', file: 'leadership.json', order: 6 }
                ]
            }
        };
    }

    getDefaultCategories() {
        return this.getDefaultConfig().skillsConfig.categories;
    }

    fallbackToStaticData() {
        console.log('Using fallback static data');
        // Implementa rendering statico come backup
        this.renderStaticSkills();
    }

    renderStaticSkills() {
        // Backup rendering con dati statici
        const skillsConfig = {
            programming: {
                title: 'Linguaggi di Programmazione',
                icon: 'fas fa-code',
                skills: ['JAVA', 'PYTHON', 'XML', 'SQL', 'PHP', 'HTML', 'JAVASCRIPT', 'CSS']
            }
            // ... altri
        };

        const container = document.getElementById('skillsContainer');
        if (container) {
            Object.entries(skillsConfig).forEach(([key, category], index) => {
                const element = this.createSkillCategoryElement(category, index);
                container.appendChild(element);
            });
        }
    }

    // Utility per aggiungere nuove skills (per sviluppi futuri)
    async addSkill(categoryId, skillData) {
        if (this.skillsData[categoryId]) {
            this.skillsData[categoryId].skills.push(skillData);
            this.renderSkills();
            
            // In futuro: salvare su server/localStorage
            console.log(`Added skill ${skillData.name || skillData} to ${categoryId}`);
        }
    }

    async addCategory(categoryData) {
        this.skillsData[categoryData.id] = categoryData;
        this.config.skillsConfig.categories.push({
            id: categoryData.id,
            file: `${categoryData.id}.json`,
            order: this.config.skillsConfig.categories.length + 1
        });
        this.renderSkills();
        
        console.log(`Added new category: ${categoryData.title}`);
    }

    // Export functionality
    exportToJSON() {
        const dataStr = JSON.stringify(this.skillsData, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
        
        const exportFileDefaultName = `portfolio-skills-${new Date().toISOString().split('T')[0]}.json`;
        
        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
    }
}

// Funzioni globali di utilità
function downloadCV() {
    // Implementare il download del CV PDF
    window.open('./docs/cv-emilio-mantegazza.pdf', '_blank');
}

// Inizializzazione app
document.addEventListener('DOMContentLoaded', () => {
    window.portfolioApp = new PortfolioApp();
    
    // Aggiungi styles per modal e tooltip
    const styles = `
        <style>
        .skill-modal {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.8);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 1000;
            opacity: 0;
            transition: opacity 0.3s ease;
        }
        
        .skill-modal.active {
            opacity: 1;
        }
        
        .modal-content {
            background: #1e1e3f;
            border-radius: 15px;
            padding: 30px;
            max-width: 600px;
            width: 90%;
            max-height: 80vh;
            overflow-y: auto;
            color: #e0e0e0;
        }
        
        .modal-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 20px;
            border-bottom: 1px solid rgba(255,255,255,0.1);
            padding-bottom: 15px;
        }
        
        .close-modal {
            font-size: 1.5rem;
            cursor: pointer;
            color: #9ca3af;
        }

        .close-modal:hover {
            color: #fff;
        }
        
        .skill-meta {
            display: flex;
            gap: 15px;
            margin-bottom: 15px;
            flex-wrap: wrap;
        }
        
        .skill-level {
            font-size: 0.8rem;
            color: #4facfe;
            margin-left: 5px;
        }
        
        .search-container {
            margin-top: 20px;
            position: relative;
        }
        
        #skillSearch {
            width: 100%;
            padding: 12px 40px 12px 15px;
            border: 1px solid rgba(255,255,255,0.2);
            border-radius: 25px;
            background: rgba(255,255,255,0.1);
            color: #e0e0e0;
            font-size: 1rem;
        }
        
        .search-icon {
            position: absolute;
            right: 15px;
            top: 50%;
            transform: translateY(-50%);
            color: #9ca3af;
        }
        
        .category-description {
            color: #b0b0b0;
            font-size: 0.9rem;
            margin: 5px 0;
        }
        
        .category-stats {
            margin-top: 15px;
            display: flex;
            justify-content: space-between;
            font-size: 0.8rem;
            color: #9ca3af;
        }
        
        .detailed-skill {
            position: relative;
        }
        
        .filter-container {
            margin-top: 15px;
        }
        
        .filter-group label {
            color: #b0b0b0;
            margin-right: 10px;
        }
        
        #levelFilter {
            padding: 5px 10px;
            border-radius: 5px;
            background: rgba(255,255,255,0.1);
            border: 1px solid rgba(255,255,255,0.2);
            color: #e0e0e0;
        }
        </style>
    `;
    
    document.head.insertAdjacentHTML('beforeend', styles);
});