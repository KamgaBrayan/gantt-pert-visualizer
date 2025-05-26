'use client';

import React, { useRef, useEffect, useState } from 'react';
import { Task, PertDiagram } from '@/lib/types';
import { formatDuration } from '@/lib/utils';
import { layoutPertDiagram } from '@/lib/pert';
import * as d3 from 'd3';

interface PertChartProps {
  tasks: Task[];
  criticalPath?: string[];
  pertDiagram?: PertDiagram;
  width?: number;
  height?: number;
  onTaskClick?: (task: Task) => void;
}

export default function PertChart({
  tasks,
  criticalPath = [],
  pertDiagram,
  width = 1200,
  height = 700,
  onTaskClick
}: PertChartProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width, height });
  const [isLoading, setIsLoading] = useState(true);
  const margin = { top: 60, right: 60, bottom: 60, left: 60 };
  
  const colors = {
    primary: '#040642',
    secondary: '#6d38e0',
    accent: '#198eb4',
    critical: '#e53e3e',
    surface: '#ffffff',
    text: '#1a202c',
    textSecondary: '#4a5568',
    border: '#e2e8f0'
  };
  
  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        const containerWidth = containerRef.current.clientWidth;
        setDimensions({
          width: Math.max(containerWidth, 1000),
          height: Math.max(height, 600)
        });
      }
    };
    
    setTimeout(() => {
      handleResize();
      setIsLoading(false);
    }, 100);
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [width, height]);
  
  useEffect(() => {
    if (!svgRef.current || !pertDiagram || isLoading) return;
    
    renderPertDiagram();
  }, [pertDiagram, dimensions, onTaskClick, isLoading, criticalPath]);
  
  const renderPertDiagram = () => {
    if (!pertDiagram) return;
    
    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();
    
    const tooltip = d3.select(tooltipRef.current);
    
    const innerWidth = dimensions.width - margin.left - margin.right;
    const innerHeight = dimensions.height - margin.top - margin.bottom;
    
    // Positionner les nœuds et activités
    const layoutedDiagram = layoutPertDiagram(pertDiagram);
    const { nodes, activities } = layoutedDiagram;
    
    // Créer les définitions SVG
    const defs = svg.append('defs');
    
    // Gradient pour nœuds normaux
    const normalGradient = defs.append('linearGradient')
      .attr('id', 'nodeNormalGradient')
      .attr('x1', '0%').attr('y1', '0%')
      .attr('x2', '100%').attr('y2', '100%');
    normalGradient.append('stop')
      .attr('offset', '0%')
      .style('stop-color', colors.surface);
    normalGradient.append('stop')
      .attr('offset', '100%')
      .style('stop-color', '#f7fafc');
    
    // Gradient pour nœuds critiques
    const criticalGradient = defs.append('linearGradient')
      .attr('id', 'nodeCriticalGradient')
      .attr('x1', '0%').attr('y1', '0%')
      .attr('x2', '100%').attr('y2', '100%');
    criticalGradient.append('stop')
      .attr('offset', '0%')
      .style('stop-color', '#fff5f5');
    criticalGradient.append('stop')
      .attr('offset', '100%')
      .style('stop-color', '#fed7d7');
    
    // Flèches
    const normalArrow = defs.append('marker')
      .attr('id', 'arrow-normal')
      .attr('viewBox', '0 -5 10 10')
      .attr('refX', 8)
      .attr('markerWidth', 6)
      .attr('markerHeight', 6)
      .attr('orient', 'auto');
    normalArrow.append('path')
      .attr('d', 'M0,-5L10,0L0,5')
      .attr('fill', colors.textSecondary);
    
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
    
    // Shadow filter
    const shadowFilter = defs.append('filter')
      .attr('id', 'shadow')
      .attr('x', '-50%').attr('y', '-50%')
      .attr('width', '200%').attr('height', '200%');
    shadowFilter.append('feDropShadow')
      .attr('dx', 0).attr('dy', 4)
      .attr('stdDeviation', 6)
      .attr('flood-color', colors.primary)
      .attr('flood-opacity', 0.15);
    
    const g = svg
      .attr('width', dimensions.width)
      .attr('height', dimensions.height)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);
    
    // Dessiner les activités (arêtes étiquetées)
    const activityGroups = g.selectAll('.activity')
      .data(activities)
      .enter()
      .append('g')
      .attr('class', 'activity');
    
    activities.forEach(activity => {
      const sourceNode = nodes.find(n => n.id === activity.sourceNodeId);
      const targetNode = nodes.find(n => n.id === activity.targetNodeId);
      
      if (!sourceNode || !targetNode) return;
      
      const sourceX = sourceNode.x || 0;
      const sourceY = sourceNode.y || 0;
      const targetX = targetNode.x || 0;
      const targetY = targetNode.y || 0;
      
      // Calculer les points de connexion aux bords des nœuds
      const nodeRadius = 40;
      const dx = targetX - sourceX;
      const dy = targetY - sourceY;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      const startX = sourceX + (dx / distance) * nodeRadius;
      const startY = sourceY + (dy / distance) * nodeRadius;
      const endX = targetX - (dx / distance) * nodeRadius;
      const endY = targetY - (dy / distance) * nodeRadius;
      
      // Dessiner la ligne
      const activityGroup = g.append('g')
        .attr('class', 'activity-line')
        .style('cursor', activity.duration > 0 ? 'pointer' : 'default');
      
      activityGroup.append('path')
        .attr('d', `M${startX},${startY} L${endX},${endY}`)
        .attr('stroke', activity.isCritical ? colors.critical : colors.textSecondary)
        .attr('stroke-width', activity.isCritical ? 3 : 2)
        .attr('stroke-dasharray', activity.duration === 0 ? '5,5' : '0')
        .attr('marker-end', activity.isCritical ? 'url(#arrow-critical)' : 'url(#arrow-normal)')
        .attr('opacity', 0)
        .transition()
        .delay(300)
        .duration(800)
        .attr('opacity', 1);
      
      // Ajouter l'étiquette de l'activité si ce n'est pas une activité fictive
      if (activity.duration > 0) {
        const midX = (startX + endX) / 2;
        const midY = (startY + endY) / 2;
        
        // Calculer l'angle de rotation pour l'étiquette
        const angle = Math.atan2(dy, dx) * 180 / Math.PI;
        
        const labelGroup = activityGroup.append('g')
          .attr('transform', `translate(${midX}, ${midY}) rotate(${angle})`)
          .style('opacity', 0);
        
        // Fond blanc pour l'étiquette
        const labelBg = labelGroup.append('rect')
          .attr('x', -35)
          .attr('y', -12)
          .attr('width', 70)
          .attr('height', 24)
          .attr('rx', 12)
          .attr('fill', activity.isCritical ? '#fff5f5' : colors.surface)
          .attr('stroke', activity.isCritical ? colors.critical : colors.border)
          .attr('stroke-width', 1)
          .attr('filter', 'url(#shadow)');
        
        // Nom de l'activité
        labelGroup.append('text')
          .attr('x', 0)
          .attr('y', -2)
          .attr('text-anchor', 'middle')
          .attr('font-size', '10px')
          .attr('font-weight', '600')
          .attr('fill', activity.isCritical ? colors.critical : colors.text)
          .text(activity.name.length > 12 ? activity.name.substring(0, 12) + '...' : activity.name);
        
        // Durée
        labelGroup.append('text')
          .attr('x', 0)
          .attr('y', 8)
          .attr('text-anchor', 'middle')
          .attr('font-size', '9px')
          .attr('fill', activity.isCritical ? colors.critical : colors.textSecondary)
          .text(`${activity.duration}j`);
        
        labelGroup.transition()
          .delay(600)
          .duration(600)
          .style('opacity', 1);
        
        // Interactions pour les activités réelles
        if (activity.duration > 0) {
          activityGroup
            .on('mouseover', function(event) {
              d3.select(this).select('rect')
                .transition()
                .duration(200)
                .attr('transform', 'scale(1.1)')
                .attr('filter', 'url(#shadow) brightness(1.1)');
              
              const task = tasks.find(t => t.id === activity.id);
              if (!task) return;
              
              tooltip
                .style('opacity', 1)
                .style('left', (event.pageX + 15) + 'px')
                .style('top', (event.pageY - 10) + 'px')
                .html(`
                  <div class="font-bold text-lg mb-2" style="color: ${colors.text}">${task.name}</div>
                  <div class="space-y-1">
                    <div class="flex justify-between">
                      <span class="text-gray-600">Durée:</span>
                      <span class="font-semibold">${formatDuration(task.duration)}</span>
                    </div>
                    <div class="flex justify-between">
                      <span class="text-gray-600">Début au plus tôt:</span>
                      <span class="font-semibold">J${task.earliestStart}</span>
                    </div>
                    <div class="flex justify-between">
                      <span class="text-gray-600">Fin au plus tôt:</span>
                      <span class="font-semibold">J${task.earliestFinish}</span>
                    </div>
                    <div class="flex justify-between">
                      <span class="text-gray-600">Marge:</span>
                      <span class="font-semibold">${task.slack} jours</span>
                    </div>
                    ${task.isCritical ? 
                      '<div class="mt-2 px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-semibold inline-block">Tâche critique</div>' 
                      : ''}
                  </div>
                `);
            })
            .on('mouseout', function() {
              d3.select(this).select('rect')
                .transition()
                .duration(200)
                .attr('transform', 'scale(1)')
                .attr('filter', 'url(#shadow)');
              
              tooltip.style('opacity', 0);
            })
            .on('click', function() {
              const task = tasks.find(t => t.id === activity.id);
              if (task && onTaskClick) {
                onTaskClick(task);
              }
            });
        }
      }
    });
    
    // Dessiner les nœuds (événements)
    const nodeGroups = g.selectAll('.node')
      .data(nodes)
      .enter()
      .append('g')
      .attr('class', 'node')
      .attr('transform', d => `translate(${d.x || 0}, ${d.y || 0})`)
      .style('cursor', 'pointer')
      .style('opacity', 0);
    
    // Animation d'apparition des nœuds
    nodeGroups
      .transition()
      .delay((d, i) => i * 100)
      .duration(800)
      .ease(d3.easeBackOut.overshoot(1.1))
      .style('opacity', 1);
    
    // Cercles pour les nœuds
    nodeGroups.append('circle')
      .attr('r', 35)
      .attr('fill', d => d.isCritical ? 'url(#nodeCriticalGradient)' : 'url(#nodeNormalGradient)')
      .attr('stroke', d => d.isCritical ? colors.critical : colors.secondary)
      .attr('stroke-width', d => d.isCritical ? 3 : 2)
      .attr('filter', 'url(#shadow)');
    
    // Numéros des événements
    nodeGroups.append('text')
      .attr('x', 0)
      .attr('y', -8)
      .attr('text-anchor', 'middle')
      .attr('font-size', '12px')
      .attr('font-weight', '700')
      .attr('fill', d => d.isCritical ? colors.critical : colors.primary)
      .text((d, i) => i + 1);
    
    // Temps des événements
    nodeGroups.append('text')
      .attr('x', 0)
      .attr('y', 6)
      .attr('text-anchor', 'middle')
      .attr('font-size', '10px')
      .attr('font-weight', '600')
      .attr('fill', d => d.isCritical ? colors.critical : colors.textSecondary)
      .text(d => `T=${d.earliestTime}`);
    
    // Nom de l'événement (en dessous)
    nodeGroups.append('text')
      .attr('x', 0)
      .attr('y', 55)
      .attr('text-anchor', 'middle')
      .attr('font-size', '11px')
      .attr('font-weight', '500')
      .attr('fill', colors.text)
      .text(d => {
        if (d.type === 'start') return 'DÉBUT';
        if (d.type === 'end') return 'FIN';
        return d.name.length > 15 ? d.name.substring(0, 15) + '...' : d.name;
      });
    
    // Interactions des nœuds
    nodeGroups
      .on('mouseover', function(event, d) {
        d3.select(this).select('circle')
          .transition()
          .duration(200)
          .attr('transform', 'scale(1.1)')
          .attr('filter', 'url(#shadow) brightness(1.1)');
        
        tooltip
          .style('opacity', 1)
          .style('left', (event.pageX + 15) + 'px')
          .style('top', (event.pageY - 10) + 'px')
          .html(`
            <div class="font-bold text-lg mb-2" style="color: ${colors.text}">${d.name}</div>
            <div class="space-y-1">
              <div class="flex justify-between">
                <span class="text-gray-600">Temps au plus tôt:</span>
                <span class="font-semibold">J${d.earliestTime}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-600">Temps au plus tard:</span>
                <span class="font-semibold">J${d.latestTime}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-600">Marge:</span>
                <span class="font-semibold">${d.slack} jours</span>
              </div>
              ${d.isCritical ? 
                '<div class="mt-2 px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-semibold inline-block">Événement critique</div>' 
                : ''}
            </div>
          `);
      })
      .on('mouseout', function() {
        d3.select(this).select('circle')
          .transition()
          .duration(200)
          .attr('transform', 'scale(1)')
          .attr('filter', 'url(#shadow)');
        
        tooltip.style('opacity', 0);
      });
    
    // Légende
    const legend = svg.append('g')
      .attr('transform', `translate(${margin.left}, 20)`);
    
    legend.append('rect')
      .attr('x', -15)
      .attr('y', -10)
      .attr('width', 400)
      .attr('height', 35)
      .attr('rx', 8)
      .attr('fill', colors.surface)
      .attr('stroke', colors.border)
      .attr('filter', 'url(#shadow)');
    
    // Légende événements
    legend.append('circle')
      .attr('r', 8)
      .attr('fill', 'url(#nodeNormalGradient)')
      .attr('stroke', colors.secondary)
      .attr('stroke-width', 2);
    
    legend.append('text')
      .attr('x', 20)
      .attr('y', 4)
      .text('Événements normaux')
      .attr('font-size', '12px')
      .attr('font-weight', '500')
      .attr('fill', colors.text);
    
    legend.append('circle')
      .attr('r', 8)
      .attr('cx', 160)
      .attr('fill', 'url(#nodeCriticalGradient)')
      .attr('stroke', colors.critical)
      .attr('stroke-width', 2);
    
    legend.append('text')
      .attr('x', 180)
      .attr('y', 4)
      .text('Chemin critique')
      .attr('font-size', '12px')
      .attr('font-weight', '500')
      .attr('fill', colors.text);
    
    // Zoom
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.3, 2])
      .on('zoom', (event) => {
        g.attr('transform', `translate(${margin.left},${margin.top}) ${event.transform}`);
      });
    
    svg.call(zoom);
  };
  
  if (isLoading) {
    return (
      <div className="relative w-full" style={{ height: `${height}px` }} ref={containerRef}>
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl">
          <div className="flex flex-col items-center space-y-4">
            <div className="relative">
              <div className="w-12 h-12 border-4 border-gray-200 border-t-purple-600 rounded-full animate-spin"></div>
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
        className="absolute pointer-events-none opacity-0 z-50 transition-all duration-200 ease-out bg-white shadow-2xl rounded-xl p-4 text-sm border border-gray-200"
        style={{ maxWidth: '320px' }}
      ></div>
      
      {/* Instructions */}
      <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm rounded-lg px-4 py-3 shadow-sm border border-gray-200">
        <h4 className="text-sm font-semibold text-gray-800 mb-2">Diagramme PERT</h4>
        <div className="text-xs text-gray-600 space-y-1">
          <div>• Les cercles représentent les <strong>événements</strong></div>
          <div>• Les flèches représentent les <strong>activités</strong> (tâches)</div>
          <div>• Les lignes pointillées sont des activités fictives</div>
        </div>
      </div>
      
      {/* Statistiques du chemin critique */}
      {criticalPath.length > 0 && (
        <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm rounded-lg px-3 py-2 shadow-sm border border-gray-200">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
            <span className="text-sm font-medium text-gray-700">
              {criticalPath.length} activité{criticalPath.length > 1 ? 's' : ''} critique{criticalPath.length > 1 ? 's' : ''}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
