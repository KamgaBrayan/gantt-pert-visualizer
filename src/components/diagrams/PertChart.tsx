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
  const [dimensions, setDimensions] = useState({ width, height });
  const margin = { top: 40, right: 40, bottom: 40, left: 40 };
  
  // État pour suivre les redimensionnements de la fenêtre
  useEffect(() => {
    const handleResize = () => {
      if (svgRef.current) {
        const containerWidth = svgRef.current.parentElement?.clientWidth || width;
        setDimensions({
          width: containerWidth,
          height: height
        });
      }
    };
    
    // Initial call
    handleResize();
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [width, height]);
  
  useEffect(() => {
    if (!svgRef.current || tasks.length === 0) return;
    
    // Nettoyer le SVG
    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();
    
    const tooltip = d3.select(tooltipRef.current);
    
    // Dimensions internes
    const innerWidth = dimensions.width - margin.left - margin.right;
    const innerHeight = dimensions.height - margin.top - margin.bottom;
    
    // Groupe principal
    const g = svg
      .attr('width', dimensions.width)
      .attr('height', dimensions.height)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);
    
    // Créer les nœuds et les liens
    const nodes = createPertNodes(tasks);
    const links = createPertLinks(tasks);
    
    // Positionner les nœuds
    const positionedNodes = layoutPertNodes(nodes, links);
    
    // Normaliser les positions des nœuds
    const xExtent = d3.extent(positionedNodes, d => d.x) as [number, number];
    const yExtent = d3.extent(positionedNodes, d => d.y) as [number, number];
    
    const xScale = d3.scaleLinear()
      .domain([xExtent[0] - 100, xExtent[1] + 100])
      .range([0, innerWidth]);
    
    const yScale = d3.scaleLinear()
      .domain([yExtent[0] - 50, yExtent[1] + 50])
      .range([0, innerHeight]);
    
    // Dessiner les liens (flèches)
    g.selectAll('.link')
      .data(links)
      .enter()
      .append('path')
      .attr('class', 'link')
      .attr('d', d => {
        const sourceNode = positionedNodes.find(n => n.id === d.source);
        const targetNode = positionedNodes.find(n => n.id === d.target);
        
        if (!sourceNode || !targetNode) return '';
        
        const sourceX = xScale(sourceNode.x || 0) + 120; // fin du nœud
        const sourceY = yScale(sourceNode.y || 0) + 30;
        const targetX = xScale(targetNode.x || 0); // début du nœud
        const targetY = yScale(targetNode.y || 0) + 30;
        
        return `M${sourceX},${sourceY} C${sourceX + 50},${sourceY} ${targetX - 50},${targetY} ${targetX},${targetY}`;
      })
      .attr('fill', 'none')
      .attr('stroke', d => {
        const sourceNode = positionedNodes.find(n => n.id === d.source);
        const targetNode = positionedNodes.find(n => n.id === d.target);
        
        if (!sourceNode || !targetNode) return '#999';
        
        return (sourceNode.isCritical && targetNode.isCritical) ? '#EA4335' : '#999';
      })
      .attr('stroke-width', d => {
        const sourceNode = positionedNodes.find(n => n.id === d.source);
        const targetNode = positionedNodes.find(n => n.id === d.target);
        
        if (!sourceNode || !targetNode) return 1.5;
        
        return (sourceNode.isCritical && targetNode.isCritical) ? 2.5 : 1.5;
      })
      .attr('marker-end', d => {
        const sourceNode = positionedNodes.find(n => n.id === d.source);
        const targetNode = positionedNodes.find(n => n.id === d.target);
        
        if (!sourceNode || !targetNode) return 'url(#arrow-normal)';
        
        return (sourceNode.isCritical && targetNode.isCritical) ? 'url(#arrow-critical)' : 'url(#arrow-normal)';
      });
    
    // Marqueurs de flèche
    svg.append('defs')
      .append('marker')
      .attr('id', 'arrow-normal')
      .attr('viewBox', '0 -5 10 10')
      .attr('refX', 8)
      .attr('markerWidth', 6)
      .attr('markerHeight', 6)
      .attr('orient', 'auto')
      .append('path')
      .attr('d', 'M0,-5L10,0L0,5')
      .attr('fill', '#999');
    
    svg.append('defs')
      .append('marker')
      .attr('id', 'arrow-critical')
      .attr('viewBox', '0 -5 10 10')
      .attr('refX', 8)
      .attr('markerWidth', 6)
      .attr('markerHeight', 6)
      .attr('orient', 'auto')
      .append('path')
      .attr('d', 'M0,-5L10,0L0,5')
      .attr('fill', '#EA4335');
    
    // Dessiner les nœuds
    const nodeGroups = g.selectAll('.node')
      .data(positionedNodes)
      .enter()
      .append('g')
      .attr('class', 'node')
      .attr('transform', d => `translate(${xScale(d.x || 0)}, ${yScale(d.y || 0)})`)
      .style('cursor', 'pointer');
    
    // Rectangles pour les nœuds
    nodeGroups.append('rect')
      .attr('width', 120)
      .attr('height', 60)
      .attr('rx', 6)
      .attr('ry', 6)
      .attr('fill', d => d.isCritical ? '#ffebe6' : '#f0f8ff')
      .attr('stroke', d => d.isCritical ? '#EA4335' : '#4285F4')
      .attr('stroke-width', d => d.isCritical ? 2 : 1);
    
    // Ligne de séparation
    nodeGroups.append('line')
      .attr('x1', 0)
      .attr('y1', 20)
      .attr('x2', 120)
      .attr('y2', 20)
      .attr('stroke', d => d.isCritical ? '#EA4335' : '#4285F4')
      .attr('stroke-width', 1);
    
    // Titre de la tâche
    nodeGroups.append('text')
      .attr('x', 60)
      .attr('y', 12)
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'middle')
      .attr('fill', d => d.isCritical ? '#B31412' : '#1A73E8')
      .attr('font-weight', 'bold')
      .attr('font-size', '12px')
      .text(d => d.name.length > 15 ? d.name.substring(0, 15) + '...' : d.name);
    
    // Infos de la tâche
    nodeGroups.append('text')
      .attr('x', 10)
      .attr('y', 35)
      .attr('fill', '#333')
      .attr('font-size', '10px')
      .text(d => `D: ${d.duration}j`);
    
    nodeGroups.append('text')
      .attr('x', 70)
      .attr('y', 35)
      .attr('fill', '#333')
      .attr('font-size', '10px')
      .text(d => `M: ${d.slack}`);
    
    nodeGroups.append('text')
      .attr('x', 10)
      .attr('y', 50)
      .attr('fill', '#333')
      .attr('font-size', '10px')
      .text(d => `ES: ${d.earliestStart}`);
    
    nodeGroups.append('text')
      .attr('x', 70)
      .attr('y', 50)
      .attr('fill', '#333')
      .attr('font-size', '10px')
      .text(d => `EF: ${d.earliestFinish}`);
    
    // Légende
    const legend = svg.append('g')
      .attr('transform', `translate(${margin.left}, 15)`);
    
    // Nœud normal
    legend.append('rect')
      .attr('width', 15)
      .attr('height', 15)
      .attr('fill', '#f0f8ff')
      .attr('stroke', '#4285F4')
      .attr('rx', 2)
      .attr('ry', 2);
    
    legend.append('text')
      .attr('x', 20)
      .attr('y', 12)
      .text('Tâches normales')
      .attr('font-size', '12px');
    
    // Nœud critique
    legend.append('rect')
      .attr('width', 15)
      .attr('height', 15)
      .attr('fill', '#ffebe6')
      .attr('stroke', '#EA4335')
      .attr('rx', 2)
      .attr('ry', 2)
      .attr('transform', 'translate(150, 0)');
    
    legend.append('text')
      .attr('x', 170)
      .attr('y', 12)
      .text('Tâches critiques')
      .attr('font-size', '12px');
    
    // Légende pour les abréviations
    const abbreviations = svg.append('g')
      .attr('transform', `translate(${dimensions.width - 200}, 15)`);
    
    abbreviations.append('text')
      .attr('x', 0)
      .attr('y', 12)
      .text('D: Durée | M: Marge')
      .attr('font-size', '11px');
    
    abbreviations.append('text')
      .attr('x', 0)
      .attr('y', 27)
      .text('ES: Début au plus tôt | EF: Fin au plus tôt')
      .attr('font-size', '11px');
    
    // Infobulle au survol
    nodeGroups
      .on('mouseover', function(event, d) {
        const task = tasks.find(t => t.id === d.id);
        if (!task) return;
        
        tooltip
          .style('opacity', 1)
          .style('left', (event.pageX + 10) + 'px')
          .style('top', (event.pageY - 10) + 'px')
          .html(`
            <div class="font-bold">${task.name}</div>
            <div>Durée: ${formatDuration(task.duration)}</div>
            <div>Début au plus tôt: ${d.earliestStart}</div>
            <div>Fin au plus tôt: ${d.earliestFinish}</div>
            <div>Début au plus tard: ${d.latestStart}</div>
            <div>Fin au plus tard: ${d.latestFinish}</div>
            <div>Marge: ${d.slack}</div>
            ${task.predecessors.length > 0 ? 
              `<div>Prédécesseurs: ${task.predecessors.map(predId => {
                const predTask = tasks.find(t => t.id === predId);
                return predTask ? predTask.name : predId;
              }).join(', ')}</div>` 
              : ''}
            ${d.isCritical ? '<div class="font-bold text-red-600">Tâche critique</div>' : ''}
          `);
      })
      .on('mouseout', function() {
        tooltip.style('opacity', 0);
      })
      .on('click', function(event, d) {
        const task = tasks.find(t => t.id === d.id);
        if (task && onTaskClick) {
          onTaskClick(task);
        }
      });
    
    // Zoom
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.5, 3])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
      });
    
    svg.call(zoom);
    
  }, [tasks, criticalPath, dimensions, onTaskClick]);
  
  return (
    <div className="relative">
      <svg ref={svgRef} className="shadow-sm rounded-lg bg-white"></svg>
      <div
        ref={tooltipRef}
        className="absolute bg-white shadow-lg rounded-lg p-2 text-sm pointer-events-none opacity-0 z-10 transition-opacity"
        style={{ 
          maxWidth: '250px',
          border: '1px solid #ddd',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
        }}
      ></div>
    </div>
  );
}