/**
 * Client Selection Module
 * Provides Minecraft client selection and related functionality
 */

import { switchToScreen } from './navigation.js';
import { requestPlayerStats } from './statsDisplay.js';

export function initClientSelection(appState, updateState) {
    console.log('Initializing client selection module...');
    
    try {
        if (!appState) {
            console.error('App state is not available');
            return;
        }
        
        const clientCards = document.querySelectorAll('.client-card');
        
        if (!clientCards || clientCards.length === 0) {
            console.error('No client cards found');
            return;
        }
        
        // On initial load, mark previously selected client if exists
        if (appState.selectedClient) {
            const clientCard = document.querySelector(`.client-card[data-client="${appState.selectedClient}"]`);
            if (clientCard) {
                clientCard.setAttribute('data-selected', 'true');
            }
        }
        
        // When client cards are clicked
        clientCards.forEach(card => {
            if (!card) return;
            
            card.addEventListener('click', () => {
                // Update selected client
                clientCards.forEach(c => {
                    if (c) c.removeAttribute('data-selected');
                });
                card.setAttribute('data-selected', 'true');
                
                const selectedClient = card.getAttribute('data-client');
                if (!selectedClient) {
                    console.error('Client card has no data-client attribute');
                    return;
                }
                
                updateState('selectedClient', selectedClient);
                
                // Switch to stats screen
                switchToScreen('stats-screen');
                
                // If API key exists, request stats immediately
                if (appState.apiKey) {
                    requestPlayerStats(appState);
                }
            });
        });
        
        console.log('Client selection module initialized');
    } catch (e) {
        console.error('Error initializing client selection:', e);
    }
} 