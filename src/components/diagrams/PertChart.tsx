'use client';

import React, { useRef, useEffect, useState } from 'react';
import { Task, PertNode, Link } from '@/lib/types';
import { formatDuration } from '@/lib/utils';
import { createPertNodes, createPertLinks, layoutPertNodes } from '@/lib/pert';
import * as d3 from 'd3';

interface PertChartProps {
  tasks: Task[];
  criticalPath?: string[];
  width?: number;
  height?: number;
  onTaskClick?: (task: Task) => void;
}

export default function PertChart({
  tasks,
  criticalPath = [],
  width = 900,
  height = 600,
  onTaskClick
}: PertChartProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width, height });
  const [isLoading, setIsLoading] = useState(true);
  const margin = { top: 80, right: 60, bottom: 60, left: 60 };
  
  // Couleurs de l'application
  const colors = {
    primary: '#040642',
    secondary: '#6d38e0',
    accent: '#198eb4',
    background: '#fafbfc',
    surface: '#ffffff',
    surfaceHover: '#f8fafc',
    text: '#1a202c',
    textSecondary: '#4a5568',
    textMuted: '#718096',
    border: '#e2e8f0',
    borderHover: '#cbd5e0',
    success: '#48bb78',
    warning: '#ed8936',
    critical: '#e53e3e'
  };
  
  // État pour suivre les redimensionnements de la fenêtre
  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        const containerWidth = containerRef.current.clientWidth;
        setDimensions({
          width: Math.max(containerWidth, 800),
          height: Math.max(height, 500)
        });
      }
    };
    
    // Initial call avec délai pour permettre le rendu
    setTimeout(() => {
      handleResize();
      setIsLoading(false);
    }, 100);
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [width, height]);
  
  useEffect(() => {
    if (!svgRef.current || tasks.length === 0 || isLoading) return;
    
    // Nettoyer le SVG
    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();
    
    const tooltip = d3.select(tooltipRef.current);
    
    // Dimensions internes
    const innerWidth = dimensions.width - margin.left - margin.right;
    const innerHeight = dimensions.height - margin.top - margin.bottom;
    
    // Groupe principal avec animation d'entrée
    const g = svg
      .attr('width', dimensions.width)
      .attr('height', dimensions.height)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`)
      .style('opacity', 0);
    
    // Animation d'apparition du graphique
    g.transition()
      .duration(800)
      .ease(d3.easeBackOut.overshoot(1.2))
      .style('opacity', 1);
    
    // Gradient definitions
    const defs = svg.append('defs');
    
    // Gradient pour les nœuds normaux
    const normalGradient = defs.append('linearGradient')
      .attr('id', 'normalGradient')
      .attr('x1', '0%').attr('y1', '0%')
      .attr('x2', '100%').attr('y2', '100%');
    normalGradient.append('stop')
      .attr('offset', '0%')
      .style('stop-color', colors.surface)
      .style('stop-opacity', 1);
    normalGradient.append('stop')
      .attr('offset', '100%')
      .style('stop-color', '#f7fafc')
      .style('stop-opacity', 1);
    
    // Gradient pour les nœuds critiques
    const criticalGradient = defs.append('linearGradient')
      .attr('id', 'criticalGradient')
      .attr('x1', '0%').attr('y1', '0%')
      .attr('x2', '100%').attr('y2', '100%');
    criticalGradient.append('stop')
      .attr('offset', '0%')
      .style('stop-color', '#fff5f5')
      .style('stop-opacity', 1);
    criticalGradient.append('stop')
      .attr('offset', '100%')
      .style('stop-color', '#fed7d7')
      .style('stop-opacity', 1);
    
    // Gradient pour les nœuds hover
    const hoverGradient = defs.append('linearGradient')
      .attr('id', 'hoverGradient')
      .attr('x1', '0%').attr('y1', '0%')
      .attr('x2', '100%').attr('y2', '100%');
    hoverGradient.append('stop')
      .attr('offset', '0%')
      .style('stop-color', colors.secondary)
      .style('stop-opacity', 0.1);
    hoverGradient.append('stop')
      .attr('offset', '100%')
      .style('stop-color', colors.accent)
      .style('stop-opacity', 0.1);
    
    // Shadow filter
    const shadowFilter = defs.append('filter')
      .attr('id', 'shadow')
      .attr('x', '-50%').attr('y', '-50%')
      .attr('width', '200%').attr('height', '200%');
    shadowFilter.append('feDropShadow')
      .attr('dx', 0).attr('dy', 4)
      .attr('stdDeviation', 8)
      .attr('flood-color', colors.primary)
      .attr('flood-opacity', 0.1);
    
    // Glow filter for critical path
    const glowFilter = defs.append('filter')
      .attr('id', 'glow')
      .attr('x', '-50%').attr('y', '-50%')
      .attr('width', '200%').attr('height', '200%');
    glowFilter.append('feGaussianBlur')
      .attr('stdDeviation', 3)
      .attr('result', 'coloredBlur');
    const feMerge = glowFilter.append('feMerge');
    feMerge.append('feMergeNode').attr('in', 'coloredBlur');
    feMerge.append('feMergeNode').attr('in', 'SourceGraphic');
    
    // Créer les nœuds et les liens
    const nodes = createPertNodes(tasks);
    const links = createPertLinks(tasks);
    
    // Positionner les nœuds
    const positionedNodes = layoutPertNodes(nodes, links);
    
    // Normaliser les positions des nœuds avec plus d'espace
    const xExtent = d3.extent(positionedNodes, d => d.x) as [number, number];
    const yExtent = d3.extent(positionedNodes, d => d.y) as [number, number];
    
    const xScale = d3.scaleLinear()
      .domain([xExtent[0] - 150, xExtent[1] + 150])
      .range([0, innerWidth]);
    
    const yScale = d3.scaleLinear()
      .domain([yExtent[0] - 100, yExtent[1] + 100])
      .range([0, innerHeight]);
    
    // Dessiner les liens (flèches) avec animations
    const linkPaths = g.selectAll('.link')
      .data(links)
      .enter()
      .append('path')
      .attr('class', 'link')
      .attr('d', d => {
        const sourceNode = positionedNodes.find(n => n.id === d.source);
        const targetNode = positionedNodes.find(n => n.id === d.target);
        
        if (!sourceNode || !targetNode) return '';
        
        const sourceX = xScale(sourceNode.x || 0) + 140;
        const sourceY = yScale(sourceNode.y || 0) + 40;
        const targetX = xScale(targetNode.x || 0);
        const targetY = yScale(targetNode.y || 0) + 40;
        
        const midX = (sourceX + targetX) / 2;
        const midY = (sourceY + targetY) / 2 - 20;
        
        return `M${sourceX},${sourceY} Q${midX},${midY} ${targetX},${targetY}`;
      })
      .attr('fill', 'none')
      .attr('stroke', d => {
        const sourceNode = positionedNodes.find(n => n.id === d.source);
        const targetNode = positionedNodes.find(n => n.id === d.target);
        
        if (!sourceNode || !targetNode) return colors.border;
        
        return (sourceNode.isCritical && targetNode.isCritical) ? colors.critical : colors.textMuted;
      })
      .attr('stroke-width', d => {
        const sourceNode = positionedNodes.find(n => n.id === d.source);
        const targetNode = positionedNodes.find(n => n.id === d.target);
        
        return (sourceNode?.isCritical && targetNode?.isCritical) ? 3 : 2;
      })
      .attr('stroke-dasharray', function(d) {
        const sourceNode = positionedNodes.find(n => n.id === d.source);
        const targetNode = positionedNodes.find(n => n.id === d.target);
        
        if (sourceNode?.isCritical && targetNode?.isCritical) {
          return '0';
        }
        return '5,5';
      })
      .attr('marker-end', d => {
        const sourceNode = positionedNodes.find(n => n.id === d.source);
        const targetNode = positionedNodes.find(n => n.id === d.target);
        
        return (sourceNode?.isCritical && targetNode?.isCritical) ? 'url(#arrow-critical)' : 'url(#arrow-normal)';
      })
      .style('opacity', 0)
      .attr('filter', d => {
        const sourceNode = positionedNodes.find(n => n.id === d.source);
        const targetNode = positionedNodes.find(n => n.id === d.target);
        
        return (sourceNode?.isCritical && targetNode?.isCritical) ? 'url(#glow)' : 'none';
      });
    
    // Animation des liens
    linkPaths
      .transition()
      .delay((d, i) => i * 100)
      .duration(1000)
      .ease(d3.easeCircleOut)
      .style('opacity', 1);
    
    // Marqueurs de flèche améliorés
    const normalArrow = defs.append('marker')
      .attr('id', 'arrow-normal')
      .attr('viewBox', '0 -5 10 10')
      .attr('refX', 8)
      .attr('markerWidth', 6)
      .attr('markerHeight', 6)
      .attr('orient', 'auto');
    normalArrow.append('path')
      .attr('d', 'M0,-5L10,0L0,5')
      .attr('fill', colors.textMuted);
    
    const criticalArrow = defs.append('marker')
      .attr('id', 'arrow-critical')
      .attr('viewBox', '0 -5 10 10')
      .attr('refX', 8)
      .attr('markerWidth', 7)
      .attr('markerHeight', 7)
      .attr('orient', 'auto');
    criticalArrow.append('path')
      .attr('d', 'M0,-5L10,0L0,5')
      .attr('fill', colors.critical);
    
    // Dessiner les nœuds avec animations
    const nodeGroups = g.selectAll('.node')
      .data(positionedNodes)
      .enter()
      .append('g')
      .attr('class', 'node')
      .attr('transform', d => `translate(${xScale(d.x || 0)}, ${yScale(d.y || 0)})`)
      .style('cursor', 'pointer')
      .style('opacity', 0);
    
    // Animation d'apparition des nœuds
    nodeGroups
      .transition()
      .delay((d, i) => i * 150 + 500)
      .duration(800)
      .ease(d3.easeBackOut.overshoot(1.1))
      .style('opacity', 1)
      .attr('transform', d => `translate(${xScale(d.x || 0)}, ${yScale(d.y || 0)}) scale(1)`);
    
    // Rectangles pour les nœuds avec design moderne
    const nodeRects = nodeGroups.append('rect')
      .attr('width', 140)
      .attr('height', 80)
      .attr('rx', 12)
      .attr('ry', 12)
      .attr('fill', d => d.isCritical ? 'url(#criticalGradient)' : 'url(#normalGradient)')
      .attr('stroke', d => d.isCritical ? colors.critical : colors.secondary)
      .attr('stroke-width', d => d.isCritical ? 2 : 1.5)
      .attr('filter', 'url(#shadow)')
      .style('transition', 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)');
    
    // Ligne de séparation élégante
    nodeGroups.append('line')
      .attr('x1', 12)
      .attr('y1', 28)
      .attr('x2', 128)
      .attr('y2', 28)
      .attr('stroke', d => d.isCritical ? colors.critical : colors.secondary)
      .attr('stroke-width', 1.5)
      .attr('opacity', 0.6);
    
    // Icône de statut (optionnel)
    nodeGroups.append('circle')
      .attr('cx', 125)
      .attr('cy', 15)
      .attr('r', 4)
      .attr('fill', d => d.isCritical ? colors.critical : colors.success)
      .attr('opacity', 0.8);
    
    // Titre de la tâche avec meilleure typographie
    nodeGroups.append('text')
      .attr('x', 70)
      .attr('y', 18)
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'middle')
      .attr('fill', d => d.isCritical ? colors.critical : colors.primary)
      .attr('font-weight', '600')
      .attr('font-size', '13px')
      .attr('font-family', 'Inter, system-ui, sans-serif')
      .text(d => d.name.length > 16 ? d.name.substring(0, 16) + '...' : d.name);
    
    // Informations avec layout amélioré
    const infoY = 45;
    const infoSpacing = 15;
    
    // Première ligne d'informations
    nodeGroups.append('text')
      .attr('x', 15)
      .attr('y', infoY)
      .attr('fill', colors.textSecondary)
      .attr('font-size', '11px')
      .attr('font-weight', '500')
      .attr('font-family', 'Inter, system-ui, sans-serif')
      .text(d => `Durée: ${d.duration}j`);
    
    nodeGroups.append('text')
      .attr('x', 85)
      .attr('y', infoY)
      .attr('fill', colors.textSecondary)
      .attr('font-size', '11px')
      .attr('font-weight', '500')
      .attr('font-family', 'Inter, system-ui, sans-serif')
      .text(d => `Marge: ${d.slack}`);
    
    // Deuxième ligne d'informations
    nodeGroups.append('text')
      .attr('x', 15)
      .attr('y', infoY + infoSpacing)
      .attr('fill', colors.textMuted)
      .attr('font-size', '10px')
      .attr('font-family', 'Inter, system-ui, sans-serif')
      .text(d => `Début: ${d.earliestStart}`);
    
    nodeGroups.append('text')
      .attr('x', 85)
      .attr('y', infoY + infoSpacing)
      .attr('fill', colors.textMuted)
      .attr('font-size', '10px')
      .attr('font-family', 'Inter, system-ui, sans-serif')
      .text(d => `Fin: ${d.earliestFinish}`);
    
    // Légende moderne
    const legend = svg.append('g')
      .attr('transform', `translate(${margin.left}, 25)`);
    
    // Background de la légende
    legend.append('rect')
      .attr('x', -15)
      .attr('y', -10)
      .attr('width', 320)
      .attr('height', 35)
      .attr('rx', 8)
      .attr('fill', colors.surface)
      .attr('stroke', colors.border)
      .attr('stroke-width', 1)
      .attr('filter', 'url(#shadow)');
    
    // Nœud normal dans la légende
    legend.append('rect')
      .attr('width', 18)
      .attr('height', 12)
      .attr('fill', 'url(#normalGradient)')
      .attr('stroke', colors.secondary)
      .attr('stroke-width', 1.5)
      .attr('rx', 3);
    
    legend.append('text')
      .attr('x', 25)
      .attr('y', 9)
      .text('Tâches normales')
      .attr('font-size', '12px')
      .attr('font-weight', '500')
      .attr('font-family', 'Inter, system-ui, sans-serif')
      .attr('fill', colors.text);
    
    // Nœud critique dans la légende
    legend.append('rect')
      .attr('width', 18)
      .attr('height', 12)
      .attr('fill', 'url(#criticalGradient)')
      .attr('stroke', colors.critical)
      .attr('stroke-width', 1.5)
      .attr('rx', 3)
      .attr('transform', 'translate(140, 0)');
    
    legend.append('text')
      .attr('x', 165)
      .attr('y', 9)
      .text('Chemin critique')
      .attr('font-size', '12px')
      .attr('font-weight', '500')
      .attr('font-family', 'Inter, system-ui, sans-serif')
      .attr('fill', colors.text);
    
    // Interactions avancées
    nodeGroups
      .on('mouseenter', function(event, d) {
        const node = d3.select(this);
        const rect = node.select('rect');
        
        // Animation de hover
        rect
          .transition()
          .duration(200)
          .ease(d3.easeCubicOut)
          .attr('transform', 'scale(1.05)')
          .attr('fill', 'url(#hoverGradient)')
          .attr('stroke-width', 2.5)
          .style('filter', 'url(#shadow) brightness(1.1)');
        
        node
          .transition()
          .duration(200)
          .ease(d3.easeCubicOut)
          .attr('transform', `translate(${xScale(d.x || 0)}, ${yScale(d.y || 0)}) scale(1.02)`);
        
        // Afficher le tooltip
        const task = tasks.find(t => t.id === d.id);
        if (!task) return;
        
        tooltip
          .style('opacity', 0)
          .style('left', (event.pageX + 15) + 'px')
          .style('top', (event.pageY - 10) + 'px')
          .html(`
            <div class="tooltip-content">
              <div class="tooltip-header">
                <h3>${task.name}</h3>
                ${d.isCritical ? '<span class="critical-badge">Critique</span>' : ''}
              </div>
              <div class="tooltip-body">
                <div class="tooltip-row">
                  <span class="label">Durée:</span>
                  <span class="value">${formatDuration(task.duration)}</span>
                </div>
                <div class="tooltip-row">
                  <span class="label">Début au plus tôt:</span>
                  <span class="value">${d.earliestStart}</span>
                </div>
                <div class="tooltip-row">
                  <span class="label">Fin au plus tôt:</span>
                  <span class="value">${d.earliestFinish}</span>
                </div>
                <div class="tooltip-row">
                  <span class="label">Marge totale:</span>
                  <span class="value">${d.slack} jours</span>
                </div>
                ${task.predecessors.length > 0 ? 
                  `<div class="tooltip-row">
                    <span class="label">Prédécesseurs:</span>
                    <span class="value">${task.predecessors.map(predId => {
                      const predTask = tasks.find(t => t.id === predId);
                      return predTask ? predTask.name : predId;
                    }).join(', ')}</span>
                  </div>` 
                  : ''}
              </div>
            </div>
          `)
          .transition()
          .duration(200)
          .style('opacity', 1);
      })
      .on('mouseleave', function(event, d) {
        const node = d3.select(this);
        const rect = node.select('rect');
        
        // Animation de sortie
        rect
          .transition()
          .duration(300)
          .ease(d3.easeCubicOut)
          .attr('transform', 'scale(1)')
          .attr('fill', d.isCritical ? 'url(#criticalGradient)' : 'url(#normalGradient)')
          .attr('stroke-width', d.isCritical ? 2 : 1.5)
          .style('filter', 'url(#shadow)');
        
        node
          .transition()
          .duration(300)
          .ease(d3.easeCubicOut)
          .attr('transform', `translate(${xScale(d.x || 0)}, ${yScale(d.y || 0)}) scale(1)`);
        
        tooltip
          .transition()
          .duration(150)
          .style('opacity', 0);
      })
      .on('click', function(event, d) {
        // Animation de clic
        const node = d3.select(this);
        node
          .transition()
          .duration(150)
          .ease(d3.easeBackIn.overshoot(2))
          .attr('transform', `translate(${xScale(d.x || 0)}, ${yScale(d.y || 0)}) scale(0.95)`)
          .transition()
          .duration(200)
          .ease(d3.easeBackOut.overshoot(1.5))
          .attr('transform', `translate(${xScale(d.x || 0)}, ${yScale(d.y || 0)}) scale(1)`);
        
        const task = tasks.find(t => t.id === d.id);
        if (task && onTaskClick) {
          onTaskClick(task);
        }
      });
    
    // Zoom avec contraintes améliorées
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.3, 2.5])
      .translateExtent([[-200, -200], [dimensions.width + 200, dimensions.height + 200]])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
      });
    
    svg.call(zoom);
    
    // Contrôles de zoom (optionnel)
    const zoomControls = svg.append('g')
      .attr('transform', `translate(${dimensions.width - 80}, ${dimensions.height - 100})`);
    
    // Bouton zoom in
    const zoomInBtn = zoomControls.append('g')
      .style('cursor', 'pointer')
      .on('click', () => {
        svg.transition().call(zoom.scaleBy, 1.5);
      });
    
    zoomInBtn.append('circle')
      .attr('r', 18)
      .attr('fill', colors.surface)
      .attr('stroke', colors.border)
      .attr('stroke-width', 1.5)
      .attr('filter', 'url(#shadow)');
    
    zoomInBtn.append('text')
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'middle')
      .attr('font-size', '16px')
      .attr('font-weight', 'bold')
      .attr('fill', colors.primary)
      .text('+');
    
    // Bouton zoom out
    const zoomOutBtn = zoomControls.append('g')
      .attr('transform', 'translate(0, 45)')
      .style('cursor', 'pointer')
      .on('click', () => {
        svg.transition().call(zoom.scaleBy, 0.75);
      });
    
    zoomOutBtn.append('circle')
      .attr('r', 18)
      .attr('fill', colors.surface)
      .attr('stroke', colors.border)
      .attr('stroke-width', 1.5)
      .attr('filter', 'url(#shadow)');
    
    zoomOutBtn.append('text')
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'middle')
      .attr('font-size', '16px')
      .attr('font-weight', 'bold')
      .attr('fill', colors.primary)
      .text('−');
    
  }, [tasks, criticalPath, dimensions, onTaskClick, isLoading]);
  
  if (isLoading) {
    return (
      <div className="relative w-full" style={{ height: `${height}px` }} ref={containerRef}>
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl">
          <div className="flex flex-col items-center space-y-4">
            <div className="relative">
              <div className="w-12 h-12 border-4 border-gray-200 border-t-purple-600 rounded-full animate-spin"></div>
              <div className="absolute inset-0 w-12 h-12 border-4 border-transparent border-l-blue-500 rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1s' }}></div>
            </div>
            <p className="text-gray-600 font-medium">Génération du diagramme PERT...</p>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="relative w-full bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl overflow-hidden" ref={containerRef}>
      <svg 
        ref={svgRef} 
        className="w-full shadow-lg bg-white"
        style={{ 
          background: 'linear-gradient(135deg, #fafbfc 0%, #f7fafc 100%)',
          fontFamily: 'Inter, system-ui, sans-serif'
        }}
      />
      <div
        ref={tooltipRef}
        className="absolute pointer-events-none opacity-0 z-50 transition-all duration-200 ease-out"
        style={{ 
          maxWidth: '320px',
        }}
      >
        <style jsx>{`
          .tooltip-content {
            background: white;
            border-radius: 12px;
            padding: 16px;
            box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
            border: 1px solid #e2e8f0;
            font-family: 'Inter', system-ui, sans-serif;
          }
          .tooltip-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 12px;
            padding-bottom: 8px;
            border-bottom: 1px solid #e2e8f0;
          }
          .tooltip-header h3 {
            margin: 0;
            font-size: 14px;
            font-weight: 600;
            color: #1a202c;
          }
          .critical-badge {
            background: #fed7d7;
            color: #c53030;
            padding: 2px 8px;
            border-radius: 12px;
            font-size: 10px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.05em;
          }
          .tooltip-body {
            space-y: 8px;
          }
          .tooltip-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 6px;
          }
          .tooltip-row .label {
            font-size: 12px;
            color: #4a5568;
            font-weight: 500;
          }
          .tooltip-row .value {
            font-size: 12px;
            color: #1a202c;
            font-weight: 600;
          }
        `}</style>
      </div>
      
      {/* Contrôles et informations supplémentaires */}
      <div className="absolute top-4 right-4 flex space-x-2">
        {/* Indicateur de tâches critiques */}
        {criticalPath.length > 0 && (
          <div className="bg-white/90 backdrop-blur-sm rounded-lg px-3 py-2 shadow-sm border border-gray-200">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium text-gray-700">
                {criticalPath.length} tâche{criticalPath.length > 1 ? 's' : ''} critique{criticalPath.length > 1 ? 's' : ''}
              </span>
            </div>
          </div>
        )}
        
        {/* Statistiques du projet */}
        <div className="bg-white/90 backdrop-blur-sm rounded-lg px-3 py-2 shadow-sm border border-gray-200">
          <div className="text-sm">
            <div className="font-semibold text-gray-800">
              {tasks.length} tâche{tasks.length > 1 ? 's' : ''}
            </div>
            <div className="text-xs text-gray-600">
              Total du projet
            </div>
          </div>
        </div>
      </div>
      
      {/* Légende des abréviations repositionnée */}
      <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm rounded-lg px-4 py-3 shadow-sm border border-gray-200">
        <h4 className="text-sm font-semibold text-gray-800 mb-2">Légende</h4>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-gray-600">
          <div><span className="font-medium">D:</span> Durée</div>
          <div><span className="font-medium">M:</span> Marge</div>
          <div><span className="font-medium">ES:</span> Début au plus tôt</div>
          <div><span className="font-medium">EF:</span> Fin au plus tôt</div>
        </div>
      </div>
    </div>
  );
}