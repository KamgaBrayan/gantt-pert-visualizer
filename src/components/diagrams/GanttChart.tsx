// src/components/diagrams/GanttChart.tsx - VERSION CORRIGÉE

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
    const margin = { top: 60, right: 40, bottom: 40, left: 200 };

    useEffect(() => {
        const handleResize = () => {
            if (svgRef.current) {
                const containerWidth = svgRef.current.parentElement?.clientWidth || width;
                setDimensions({
                    width: containerWidth,
                    height: Math.max(400, tasks.length * 60 + 100) // Hauteur adaptative
                });
            }
        };

        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [width, tasks.length]);

    useEffect(() => {
        if (!svgRef.current || tasks.length === 0) return;

        const svg = d3.select(svgRef.current);
        svg.selectAll('*').remove();

        const tooltip = d3.select(tooltipRef.current);

        const innerWidth = dimensions.width - margin.left - margin.right;
        const innerHeight = dimensions.height - margin.top - margin.bottom;

        const g = svg
            .attr('width', dimensions.width)
            .attr('height', dimensions.height)
            .append('g')
            .attr('transform', `translate(${margin.left},${margin.top})`);

        // CORRECTION: Échelle temporelle améliorée
        const maxTime = Math.max(...tasks.map(t => t.end || 0));
        const xScale = d3.scaleLinear()
            .domain([0, maxTime])
            .range([0, innerWidth]);

        // CORRECTION: Ordre des tâches respectant la chronologie
        const yScale = d3.scaleBand<string>()
            .domain(tasks.map(t => t.id))
            .range([0, innerHeight])
            .padding(0.2);

        // Axes avec meilleur formatage
        const xAxis = d3.axisTop(xScale)
            .ticks(Math.min(maxTime, 10))
            .tickFormat(d => `Jour ${d}`);

        g.append('g')
            .call(xAxis)
            .attr('class', 'x-axis')
            .selectAll('text')
            .attr('font-size', '11px')
            .attr('font-weight', '500');

        const yAxis = d3.axisLeft(yScale)
            .tickFormat(id => {
                const task = tasks.find(t => t.id === id);
                return task ? (task.name.length > 20 ? task.name.substring(0, 20) + '...' : task.name) : '';
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
                return task && criticalPath.includes(task.id) ? '#DC2626' : '#374151';
            });

        // Grille verticale pour les jours
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
            .attr('stroke', '#E5E7EB')
            .attr('stroke-dasharray', '2,2')
            .attr('opacity', 0.5);

        // CORRECTION: Barres de tâches avec positionnement exact
        const bars = g.selectAll('.task-bar')
            .data(tasks)
            .enter()
            .append('g')
            .attr('class', 'task-bar')
            .attr('transform', d => `translate(${xScale(d.start || 0)}, ${yScale(d.id)})`)
            .style('cursor', 'pointer');

        // Barres principales
        bars.append('rect')
            .attr('width', d => Math.max(2, xScale((d.end || 0) - (d.start || 0))))
            .attr('height', yScale.bandwidth())
            .attr('rx', 4)
            .attr('ry', 4)
            .attr('fill', d => {
                if (criticalPath.includes(d.id)) return '#DC2626'; // Rouge pour critique
                // Couleurs par équipe (comme dans l'exemple)
                const teamColors = ['#10B981', '#3B82F6', '#8B5CF6', '#F59E0B'];
                return teamColors[tasks.indexOf(d) % teamColors.length];
            })
            .attr('stroke', d => criticalPath.includes(d.id) ? '#991B1B' : 'none')
            .attr('stroke-width', 1)
            .attr('opacity', 0.8);

        // Texte de durée dans les barres
        bars.append('text')
            .attr('x', 8)
            .attr('y', yScale.bandwidth() / 2)
            .attr('dy', '0.35em')
            .attr('fill', 'white')
            .attr('font-size', '11px')
            .attr('font-weight', '600')
            .text(d => `${d.duration}j`);

        // CORRECTION: Flèches de dépendances droites (pas de courbes)
        const links: Array<{source: Task, target: Task}> = [];
        tasks.forEach(task => {
            task.predecessors.forEach(predId => {
                const predTask = tasks.find(t => t.id === predId);
                if (predTask) {
                    links.push({ source: predTask, target: task });
                }
            });
        });

        // Dessiner les flèches de dépendances
        g.selectAll('.dependency')
            .data(links)
            .enter()
            .append('path')
            .attr('class', 'dependency')
            .attr('d', d => {
                const sourceX = xScale(d.source.end || 0);
                const sourceY = yScale(d.source.id)! + yScale.bandwidth() / 2;
                const targetX = xScale(d.target.start || 0);
                const targetY = yScale(d.target.id)! + yScale.bandwidth() / 2;

                // CORRECTION: Ligne droite avec coude à 90°
                const midX = sourceX + (targetX - sourceX) / 2;

                return `M${sourceX},${sourceY} L${midX},${sourceY} L${midX},${targetY} L${targetX},${targetY}`;
            })
            .attr('fill', 'none')
            .attr('stroke', '#6B7280')
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
            .attr('fill', '#6B7280');

        // Légende améliorée
        const legend = svg.append('g')
            .attr('transform', `translate(${margin.left}, 20)`);

        const legendData = [
            { label: 'Tâches normales', color: '#3B82F6' },
            { label: 'Tâches critiques', color: '#DC2626' }
        ];

        legendData.forEach((item, i) => {
            const legendItem = legend.append('g')
                .attr('transform', `translate(${i * 150}, 0)`);

            legendItem.append('rect')
                .attr('width', 16)
                .attr('height', 16)
                .attr('fill', item.color)
                .attr('rx', 3);

            legendItem.append('text')
                .attr('x', 22)
                .attr('y', 12)
                .attr('font-size', '12px')
                .attr('fill', '#374151')
                .text(item.label);
        });

        // Événements de survol et clic
        bars
            .on('mouseover', function(event, d) {
                tooltip
                    .style('opacity', 1)
                    .style('left', (event.pageX + 10) + 'px')
                    .style('top', (event.pageY - 10) + 'px')
                    .html(`
            <div class="font-bold text-gray-800">${d.name}</div>
            <div class="text-sm text-gray-600">Durée: ${formatDuration(d.duration)}</div>
            <div class="text-sm text-gray-600">Début: Jour ${d.start}</div>
            <div class="text-sm text-gray-600">Fin: Jour ${d.end}</div>
            ${d.predecessors.length > 0 ?
                        `<div class="text-sm text-gray-600">Après: ${d.predecessors.join(', ')}</div>`
                        : ''}
            ${criticalPath.includes(d.id) ?
                        '<div class="text-sm font-bold text-red-600 mt-1">⚠️ Tâche critique</div>'
                        : ''}
          `);

                // Effet de survol
                d3.select(this).select('rect')
                    .attr('opacity', 1)
                    .attr('stroke', '#1F2937')
                    .attr('stroke-width', 2);
            })
            .on('mouseout', function() {
                tooltip.style('opacity', 0);

                d3.select(this).select('rect')
                    .attr('opacity', 0.8)
                    .attr('stroke', 'none');
            })
            .on('click', function(event, d) {
                if (onTaskClick) {
                    onTaskClick(d);
                }
            });
    }, [tasks, criticalPath, dimensions, onTaskClick]);

    return (
        <div className="relative">
            <svg ref={svgRef} className="shadow-sm rounded-lg bg-white border"></svg>
            <div
                ref={tooltipRef}
                className="absolute bg-white shadow-lg rounded-lg p-3 text-sm pointer-events-none opacity-0 z-10 transition-opacity border max-w-xs"
            ></div>
        </div>
    );
}