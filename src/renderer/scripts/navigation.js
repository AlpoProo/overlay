/**
 * Navigation Module
 * Navigation and screen transition functions
 */

export function initNavigation() {
    console.log('Initializing navigation...');
    
    try {
        const navItems = document.querySelectorAll('.nav-item');
        const screens = document.querySelectorAll('.screen');
        const navbar = document.querySelector('.navbar');
        const toggleNavButton = document.getElementById('toggle-nav-button');
        
        if (!navbar) {
            console.error('Navbar element not found');
        }
        
        // Load navbar state from localStorage
        if (navbar) {
            const navbarCollapsed = localStorage.getItem('navbar_collapsed') === 'true';
            if (navbarCollapsed) {
                navbar.classList.add('collapsed');
                if (toggleNavButton) {
                    toggleNavButton.classList.add('collapsed');
                }
            }
        }
        
        // Navbar tab switching event
        if (navItems && navItems.length > 0) {
            navItems.forEach(item => {
                item.addEventListener('click', () => {
                    if (!screens || !item) return;
                    
                    // Change active tab
                    navItems.forEach(navItem => {
                        if (navItem) navItem.classList.remove('active');
                    });
                    item.classList.add('active');
                    
                    // Show related screen
                    const targetScreen = item.getAttribute('data-screen');
                    if (!targetScreen) {
                        console.error('No target screen specified for nav item');
                        return;
                    }
                    
                    screens.forEach(screen => {
                        if (!screen) return;
                        screen.classList.remove('active');
                        if (screen.id === targetScreen) {
                            screen.classList.add('active');
                        }
                    });
                });
            });
        } else {
            console.error('No nav items found');
        }
        
        // Navbar toggle button
        if (toggleNavButton && navbar) {
            toggleNavButton.addEventListener('click', () => {
                navbar.classList.toggle('collapsed');
                toggleNavButton.classList.toggle('collapsed');
                
                // Save navbar state to localStorage
                const isCollapsed = navbar.classList.contains('collapsed');
                localStorage.setItem('navbar_collapsed', isCollapsed);
            });
        } else if (toggleNavButton) {
            console.error('Toggle nav button found but navbar not found');
        }
        
        console.log('Navigation module initialized');
    } catch (e) {
        console.error('Error initializing navigation:', e);
    }
}

/**
 * Switches to a specific screen
 * @param {string} screenId - ID of the screen to switch to
 */
export function switchToScreen(screenId) {
    if (!screenId) {
        console.error('No screen ID provided');
        return;
    }
    
    try {
        // Find the related navbar item and click it
        const navItem = document.querySelector(`.nav-item[data-screen="${screenId}"]`);
        if (navItem) {
            navItem.click();
        } else {
            console.error(`Nav item for screen ${screenId} not found`);
        }
    } catch (e) {
        console.error(`Error switching to screen ${screenId}:`, e);
    }
} 