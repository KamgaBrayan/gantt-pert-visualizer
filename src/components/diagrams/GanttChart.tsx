'use client';

import React, { useRef, useEffect, useState } from 'react';
import { Task } from '@/lib/types';
import { formatDuration } from '@/lib/utils';
import * as d3 from 'd3';

interface GanttChartProps {
  tasks: Task[];
  criticalPath?: string[];
  width?: number;
  height?: number;
  onTaskClick?: (task: Task) => void;
}

// Définir une interface pour les liens entre tâches
interface TaskLink {
  source: Task;
  target: Task;
}

export default function GanttChart({
  tasks,
  criticalPath = [],
  width = 900,
  height = 500,
  onTaskClick
}: GanttChartProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width, height });
  const margin = { top: 40, right: 40, bottom: 40, left: 200 };
  
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
    
    // Échelles
    const xScale = d3.scaleLinear()
      .domain([0, Math.max(...tasks.map(t => t.end || 0))])
      .range([0, innerWidth]);
    
    const yScale = d3.scaleBand<string>()
      .domain(tasks.map(t => t.id))
      .range([0, innerHeight])
      .padding(0.3);
    
    // Axes
    const xAxis = d3.axisTop(xScale)
      .ticks(Math.min(10, Math.max(...tasks.map(t => t.end || 0))))
      .tickFormat(d => `Jour ${d}`);
    
    g.append('g')
      .call(xAxis)
      .attr('class', 'x-axis')
      .selectAll('text')
      .attr('font-size', '10px');
    
    const yAxis = d3.axisLeft(yScale)
      .tickFormat(id => {
        const task = tasks.find(t => t.id === id);
        return task ? (task.name.length > 25 ? task.name.substring(0, 25) + '...' : task.name) : '';
      });
    
    g.append('g')
      .call(yAxis)
      .attr('class', 'y-axis')
      .selectAll('text')
      .attr('font-size', '12px')
      .attr('font-weight', id => {
        const task = tasks.find(t => t.id === id);
        return task && criticalPath.includes(task.id) ? 'bold' : 'normal';
      })
      .attr('fill', id => {
        const task = tasks.find(t => t.id === id);
        return task && criticalPath.includes(task.id) ? '#EA4335' : '#333';
      });
    
    // Lignes de grille verticales
    g.append('g')
      .attr('class', 'grid')
      .selectAll('line')
      .data(xScale.ticks())
      .enter()
      .append('line')
      .attr('x1', d => xScale(d))
      .attr('y1', 0)
      .attr('x2', d => xScale(d))
      .attr('y2', innerHeight)
      .attr('stroke', '#e0e0e0')
      .attr('stroke-dasharray', '3,3');
    
    // Barres de tâches
    const bars = g.selectAll('.task-bar')
      .data(tasks)
      .enter()
      .append('g')
      .attr('class', 'task-bar')
      .attr('transform', d => `translate(${xScale(d.start || 0)}, ${yScale(d.id)})`)
      .style('cursor', 'pointer');
    
    bars.append('rect')
      .attr('width', d => xScale((d.end || 0) - (d.start || 0)))
      .attr('height', yScale.bandwidth())
      .attr('rx', 4)
      .attr('ry', 4)
      .attr('fill', d => d.color || (criticalPath.includes(d.id) ? '#EA4335' : '#4285F4'))
      .attr('stroke', d => criticalPath.includes(d.id) ? '#B31412' : '#2962FF')
      .attr('stroke-width', 1);
    
    // Texte dans les barres
    bars.append('text')
      .attr('x', 10)
      .attr('y', yScale.bandwidth() / 2)
      .attr('dy', '0.35em')
      .attr('fill', 'white')
      .attr('font-size', '12px')
      .text(d => `${d.duration}j`);
    
    // Étiquettes de dates
    bars.append('text')
      .attr('x', d => xScale((d.end || 0) - (d.start || 0)) + 5)
      .attr('y', yScale.bandwidth() / 2)
      .attr('dy', '0.35em')
      .attr('font-size', '10px')
      .attr('fill', '#666')
      .text(d => `J${d.start} - J${d.end}`);
    
    // Flèches de dépendances
    const links: TaskLink[] = [];
    tasks.forEach(task => {
      task.predecessors.forEach(predId => {
        const predTask = tasks.find(t => t.id === predId);
        if (predTask) {
          links.push({
            source: predTask,
            target: task
          });
        }
      });
    });
    
    const lineGenerator = d3.line<[number, number]>()
      .curve(d3.curveBasis);
    
    g.selectAll('.dependency')
      .data(links)
      .enter()
      .append('path')
      .attr('class', 'dependency')
      .attr('d', l => {
        const sourceX = xScale((l.source.end || 0));
        const sourceY = yScale(l.source.id)! + yScale.bandwidth() / 2;  // Ajouter l'opérateur ! pour indiquer que la valeur n'est pas nulle
        const targetX = xScale((l.target.start || 0));
        const targetY = yScale(l.target.id)! + yScale.bandwidth() / 2;  // Ajouter l'opérateur ! pour indiquer que la valeur n'est pas nulle
        
        const midX = (sourceX + targetX) / 2;
        
        return lineGenerator([
          [sourceX, sourceY],
          [midX, sourceY],
          [midX, targetY],
          [targetX, targetY]
        ]) || '';  // Ajouter une chaîne vide comme fallback
      })
      .attr('fill', 'none')
      .attr('stroke', '#999')
      .attr('stroke-width', 1.5)
      .attr('marker-end', 'url(#arrow)');
    
    // Marqueur de flèche
    svg.append('defs')
      .append('marker')
      .attr('id', 'arrow')
      .attr('viewBox', '0 -5 10 10')
      .attr('refX', 8)
      .attr('markerWidth', 6)
      .attr('markerHeight', 6)
      .attr('orient', 'auto')
      .append('path')
      .attr('d', 'M0,-5L10,0L0,5')
      .attr('fill', '#999');
    
    // Légende
    const legend = svg.append('g')
      .attr('transform', `translate(${margin.left}, 15)`);
    
    // Tâche normale
    legend.append('rect')
      .attr('width', 15)
      .attr('height', 15)
      .attr('fill', '#4285F4')
      .attr('rx', 2)
      .attr('ry', 2);
    
    legend.append('text')
      .attr('x', 20)
      .attr('y', 12)
      .text('Tâches normales')
      .attr('font-size', '12px');
    
    // Tâche critique
    legend.append('rect')
      .attr('width', 15)
      .attr('height', 15)
      .attr('fill', '#EA4335')
      .attr('rx', 2)
      .attr('ry', 2)
      .attr('transform', 'translate(150, 0)');
    
    legend.append('text')
      .attr('x', 170)
      .attr('y', 12)
      .text('Tâches critiques')
      .attr('font-size', '12px');
    
    // Infobulle au survol
    bars
      .on('mouseover', function(event, d) {
        tooltip
          .style('opacity', 1)
          .style('left', (event.pageX + 10) + 'px')
          .style('top', (event.pageY - 10) + 'px')
          .html(`
            <div class="font-bold">${d.name}</div>
            <div>Durée: ${formatDuration(d.duration)}</div>
            <div>Début: Jour ${d.start}</div>
            <div>Fin: Jour ${d.end}</div>
            ${d.predecessors.length > 0 ? 
              `<div>Prédécesseurs: ${d.predecessors.map(predId => {
                const predTask = tasks.find(t => t.id === predId);
                return predTask ? predTask.name : predId;
              }).join(', ')}</div>` 
              : ''}
            ${criticalPath.includes(d.id) ? '<div class="font-bold text-red-600">Tâche critique</div>' : ''}
          `);
      })
      .on('mouseout', function() {
        tooltip.style('opacity', 0);
      })
      .on('click', function(event, d) {
        if (onTaskClick) {
          onTaskClick(d);
        }
      });
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