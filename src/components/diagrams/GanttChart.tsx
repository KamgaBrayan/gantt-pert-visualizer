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
  const [isLoading, setIsLoading] = useState(true);
  const margin = { top: 60, right: 60, bottom: 60, left: 250 };
  
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
    
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [width, height]);
  
  useEffect(() => {
    if (!svgRef.current || tasks.length === 0) return;
    
    setIsLoading(true);
    
    // Animation d'entrée avec délai
    setTimeout(() => {
      renderChart();
      setIsLoading(false);
    }, 300);
  }, [tasks, criticalPath, dimensions, onTaskClick]);
  
  const renderChart = () => {
    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();
    
    const tooltip = d3.select(tooltipRef.current);
    
    const innerWidth = dimensions.width - margin.left - margin.right;
    const innerHeight = dimensions.height - margin.top - margin.bottom;
    
    // Dégradés pour les barres
    const defs = svg.append('defs');
    
    // Dégradé pour tâches normales
    const normalGradient = defs.append('linearGradient')
      .attr('id', 'normalGradient')
      .attr('x1', '0%').attr('y1', '0%')
      .attr('x2', '100%').attr('y2', '100%');
    
    normalGradient.append('stop')
      .attr('offset', '0%')
      .attr('stop-color', '#198eb4')
      .attr('stop-opacity', 0.9);
    
    normalGradient.append('stop')
      .attr('offset', '100%')
      .attr('stop-color', '#6d38e0')
      .attr('stop-opacity', 0.7);
    
    // Dégradé pour tâches critiques
    const criticalGradient = defs.append('linearGradient')
      .attr('id', 'criticalGradient')
      .attr('x1', '0%').attr('y1', '0%')
      .attr('x2', '100%').attr('y2', '100%');
    
    criticalGradient.append('stop')
      .attr('offset', '0%')
      .attr('stop-color', '#ff6b6b')
      .attr('stop-opacity', 0.9);
    
    criticalGradient.append('stop')
      .attr('offset', '100%')
      .attr('stop-color', '#ff4757')
      .attr('stop-opacity', 0.8);
    
    // Filtre de brillance pour les barres
    const filter = defs.append('filter')
      .attr('id', 'glow');
    
    filter.append('feGaussianBlur')
      .attr('stdDeviation', '3')
      .attr('result', 'coloredBlur');
    
    const feMerge = filter.append('feMerge');
    feMerge.append('feMergeNode').attr('in', 'coloredBlur');
    feMerge.append('feMergeNode').attr('in', 'SourceGraphic');
    
    const g = svg
      .attr('width', dimensions.width)
      .attr('height', dimensions.height)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);
    
    // Échelles avec animations
    const xScale = d3.scaleLinear()
      .domain([0, Math.max(...tasks.map(t => t.end || 0))])
      .range([0, innerWidth]);
    
    const yScale = d3.scaleBand<string>()
      .domain(tasks.map(t => t.id))
      .range([0, innerHeight])
      .padding(0.4);
    
    // Grille avec effet de profondeur
    const gridGroup = g.append('g').attr('class', 'grid');
    
    // Lignes verticales avec dégradé
    gridGroup.selectAll('.grid-line')
      .data(xScale.ticks(8))
      .enter()
      .append('line')
      .attr('class', 'grid-line')
      .attr('x1', d => xScale(d))
      .attr('y1', -20)
      .attr('x2', d => xScale(d))
      .attr('y2', innerHeight + 20)
      .attr('stroke', 'url(#gridGradient)')
      .attr('stroke-width', 1)
      .attr('opacity', 0)
      .transition()
      .duration(800)
      .delay((d, i) => i * 100)
      .attr('opacity', 0.3);
    
    // Dégradé pour la grille
    const gridGradient = defs.append('linearGradient')
      .attr('id', 'gridGradient')
      .attr('x1', '0%').attr('y1', '0%')
      .attr('x2', '0%').attr('y2', '100%');
    
    gridGradient.append('stop')
      .attr('offset', '0%')
      .attr('stop-color', '#040642')
      .attr('stop-opacity', 0.1);
    
    gridGradient.append('stop')
      .attr('offset', '50%')
      .attr('stop-color', '#6d38e0')
      .attr('stop-opacity', 0.2);
    
    gridGradient.append('stop')
      .attr('offset', '100%')
      .attr('stop-color', '#198eb4')
      .attr('stop-opacity', 0.1);
    
    // Axe X moderne
    const xAxis = d3.axisTop(xScale)
      .ticks(8)
      .tickFormat(d => `J${d}`)
      .tickSize(-10);
    
    const xAxisGroup = g.append('g')
      .attr('class', 'x-axis')
      .attr('transform', 'translate(0, -10)')
      .call(xAxis);
    
    xAxisGroup.selectAll('text')
      .attr('font-size', '12px')
      .attr('font-weight', '500')
      .attr('fill', '#040642')
      .attr('opacity', 0)
      .transition()
      .duration(600)
      .delay(200)
      .attr('opacity', 1);
    
    xAxisGroup.select('.domain')
      .attr('stroke', '#6d38e0')
      .attr('stroke-width', 2);
    
    // Axe Y avec animations
    const yAxis = d3.axisLeft(yScale)
      .tickFormat(id => {
        const task = tasks.find(t => t.id === id);
        return task ? (task.name.length > 30 ? task.name.substring(0, 30) + '...' : task.name) : '';
      })
      .tickSize(0);
    
    const yAxisGroup = g.append('g')
      .attr('class', 'y-axis')
      .attr('transform', 'translate(-15, 0)')
      .call(yAxis);
    
    yAxisGroup.selectAll('text')
      .attr('font-size', '13px')
      .attr('font-weight', '500')
      .attr('fill', id => {
        const task = tasks.find(t => t.id === id);
        return task && criticalPath.includes(task.id) ? '#ff4757' : '#040642';
      })
      .attr('opacity', 0)
      .attr('transform', 'translate(-10, 0)')
      .transition()
      .duration(600)
      .delay((d, i) => i * 100)
      .attr('opacity', 1)
      .attr('transform', 'translate(0, 0)');
    
    yAxisGroup.select('.domain').remove();
    
    // Barres de tâches avec animations sophistiquées
    const bars = g.selectAll('.task-bar')
      .data(tasks)
      .enter()
      .append('g')
      .attr('class', 'task-bar')
      .attr('transform', d => `translate(${xScale(d.start || 0)}, ${yScale(d.id)})`)
      .style('cursor', 'pointer');
    
    // Rectangle principal avec animation
    const rects = bars.append('rect')
      .attr('width', 0)
      .attr('height', yScale.bandwidth())
      .attr('rx', 12)
      .attr('ry', 12)
      .attr('fill', d => criticalPath.includes(d.id) ? 'url(#criticalGradient)' : 'url(#normalGradient)')
      .attr('stroke', d => criticalPath.includes(d.id) ? '#ff4757' : '#6d38e0')
      .attr('stroke-width', 2)
      .attr('filter', 'url(#glow)')
      .attr('opacity', 0.8);
    
    // Animation d'apparition des barres
    rects.transition()
      .duration(1000)
      .delay((d, i) => i * 150)
      .ease(d3.easeBackOut.overshoot(1.2))
      .attr('width', d => xScale((d.end || 0) - (d.start || 0)))
      .attr('opacity', 1);
    
    // Texte de durée avec animation
    const durationText = bars.append('text')
      .attr('x', 15)
      .attr('y', yScale.bandwidth() / 2)
      .attr('dy', '0.35em')
      .attr('fill', 'white')
      .attr('font-size', '12px')
      .attr('font-weight', '600')
      .attr('opacity', 0)
      .text(d => `${d.duration}j`);
    
    durationText.transition()
      .duration(600)
      .delay((d, i) => i * 150 + 800)
      .attr('opacity', 1);
    
    // Étiquettes de dates avec style moderne
    const dateLabels = bars.append('text')
      .attr('x', d => xScale((d.end || 0) - (d.start || 0)) + 15)
      .attr('y', yScale.bandwidth() / 2)
      .attr('dy', '0.35em')
      .attr('font-size', '11px')
      .attr('font-weight', '500')
      .attr('fill', '#6d38e0')
      .attr('opacity', 0)
      .text(d => `J${d.start} → J${d.end}`);
    
    dateLabels.transition()
      .duration(600)
      .delay((d, i) => i * 150 + 1000)
      .attr('opacity', 0.8);
    
    // Liens de dépendances avec animations fluides
    const links: TaskLink[] = [];
    tasks.forEach(task => {
      task.predecessors.forEach(predId => {
        const predTask = tasks.find(t => t.id === predId);
        if (predTask) {
          links.push({ source: predTask, target: task });
        }
      });
    });
    
    // Marqueurs de flèches modernes
    defs.append('marker')
      .attr('id', 'arrow-modern')
      .attr('viewBox', '0 -5 10 10')
      .attr('refX', 8)
      .attr('markerWidth', 8)
      .attr('markerHeight', 8)
      .attr('orient', 'auto')
      .append('path')
      .attr('d', 'M0,-5L10,0L0,5')
      .attr('fill', '#6d38e0');
    
    const lineGenerator = d3.line<[number, number]>()
      .curve(d3.curveBasis);
    
    const linkPaths = g.selectAll('.dependency')
      .data(links)
      .enter()
      .append('path')
      .attr('class', 'dependency')
      .attr('d', l => {
        const sourceX = xScale((l.source.end || 0));
        const sourceY = yScale(l.source.id)! + yScale.bandwidth() / 2;
        const targetX = xScale((l.target.start || 0));
        const targetY = yScale(l.target.id)! + yScale.bandwidth() / 2;
        
        const midX = (sourceX + targetX) / 2;
        
        return lineGenerator([
          [sourceX, sourceY],
          [midX, sourceY],
          [midX, targetY],
          [targetX - 10, targetY]
        ]) || '';
      })
      .attr('fill', 'none')
      .attr('stroke', '#6d38e0')
      .attr('stroke-width', 2)
      .attr('marker-end', 'url(#arrow-modern)')
      .attr('opacity', 0)
      .attr('stroke-dasharray', function() {
        return this.getTotalLength();
      })
      .attr('stroke-dashoffset', function() {
        return this.getTotalLength();
      });
    
    linkPaths.transition()
      .duration(1500)
      .delay(1200)
      .ease(d3.easeLinear)
      .attr('stroke-dashoffset', 0)
      .attr('opacity', 0.7);
    
    // Légende moderne
    const legend = svg.append('g')
      .attr('class', 'legend')
      .attr('transform', `translate(${margin.left + 20}, 20)`);
    
    // Conteneur de légende avec fond
    legend.append('rect')
      .attr('x', -10)
      .attr('y', -5)
      .attr('width', 320)
      .attr('height', 35)
      .attr('rx', 8)
      .attr('fill', 'rgba(255, 255, 255, 0.9)')
      .attr('stroke', '#6d38e0')
      .attr('stroke-width', 1)
      .attr('opacity', 0)
      .transition()
      .duration(600)
      .delay(1500)
      .attr('opacity', 1);
    
    // Éléments de légende
    const legendItems = [
      { color: 'url(#normalGradient)', text: 'Tâches normales', x: 0 },
      { color: 'url(#criticalGradient)', text: 'Tâches critiques', x: 160 }
    ];
    
    legendItems.forEach((item, i) => {
      const legendItem = legend.append('g')
        .attr('transform', `translate(${item.x}, 0)`)
        .attr('opacity', 0);
      
      legendItem.append('rect')
        .attr('width', 18)
        .attr('height', 18)
        .attr('rx', 4)
        .attr('fill', item.color)
        .attr('stroke', i === 1 ? '#ff4757' : '#6d38e0')
        .attr('stroke-width', 1);
      
      legendItem.append('text')
        .attr('x', 25)
        .attr('y', 13)
        .attr('font-size', '12px')
        .attr('font-weight', '500')
        .attr('fill', '#040642')
        .text(item.text);
      
      legendItem.transition()
        .duration(600)
        .delay(1600 + i * 200)
        .attr('opacity', 1);
    });
    
    // Interactions avec hover effects
    bars
      .on('mouseover', function(event, d) {
        d3.select(this).select('rect')
          .transition()
          .duration(200)
          .attr('transform', 'scale(1.05)')
          .attr('filter', 'url(#glow) brightness(1.1)');
        
        tooltip
          .style('opacity', 1)
          .style('left', (event.pageX + 15) + 'px')
          .style('top', (event.pageY - 10) + 'px')
          .html(`
            <div class="font-bold text-lg mb-2" style="color: #040642">${d.name}</div>
            <div class="space-y-1">
              <div class="flex justify-between">
                <span class="text-gray-600">Durée:</span>
                <span class="font-semibold">${formatDuration(d.duration)}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-600">Période:</span>
                <span class="font-semibold">J${d.start} → J${d.end}</span>
              </div>
              ${d.predecessors.length > 0 ? 
                `<div class="border-t pt-2 mt-2">
                  <div class="text-gray-600 text-sm mb-1">Prédécesseurs:</div>
                  <div class="text-sm font-medium">${d.predecessors.map(predId => {
                    const predTask = tasks.find(t => t.id === predId);
                    return predTask ? predTask.name : predId;
                  }).join(', ')}</div>
                </div>` 
                : ''}
              ${criticalPath.includes(d.id) ? 
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
          .attr('filter', 'url(#glow)');
        
        tooltip.style('opacity', 0);
      })
      .on('click', function(event, d) {
        if (onTaskClick) {
          onTaskClick(d);
        }
      });
  };
  
  return (
    <div className="relative w-full">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/80 backdrop-blur-sm rounded-2xl z-10">
          <div className="flex items-center space-x-3">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
            <span className="text-gray-600 font-medium">Génération du diagramme...</span>
          </div>
        </div>
      )}
      
      <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-xl overflow-hidden border border-gray-200">
        <div className="p-6 bg-gradient-to-r from-purple-50 to-blue-50 border-b border-gray-200">
          <h3 className="text-xl font-bold text-gray-800 flex items-center">
            <div className="w-2 h-6 bg-gradient-to-b from-purple-500 to-blue-500 rounded-full mr-3"></div>
            Diagramme de Gantt
          </h3>
          <p className="text-gray-600 mt-1">Visualisation temporelle des tâches du projet</p>
        </div>
        
        <div className="p-6">
          <svg ref={svgRef} className="w-full"></svg>
        </div>
      </div>
      
      <div
        ref={tooltipRef}
        className="absolute bg-white shadow-2xl rounded-xl p-4 text-sm pointer-events-none opacity-0 z-20 transition-all duration-200 border border-gray-200"
        style={{ 
          maxWidth: '300px',
          backdropFilter: 'blur(10px)',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
        }}
      ></div>
    </div>
  );
}