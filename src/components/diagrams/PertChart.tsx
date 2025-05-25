// src/components/diagrams/PertChart.tsx - VERSION CONFORME À L'IMAGE 1

'use client';

import React, { useRef, useEffect, useState } from 'react';
import { Task, PertNode, Link } from '@/lib/types';
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
                                      width = 1200,
                                      height = 700,
                                      onTaskClick
                                  }: PertChartProps) {
    const svgRef = useRef<SVGSVGElement>(null);
    const tooltipRef = useRef<HTMLDivElement>(null);
    const [dimensions, setDimensions] = useState({ width, height });
    const margin = { top: 60, right: 60, bottom: 60, left: 60 };

    useEffect(() => {
        const handleResize = () => {
            if (svgRef.current?.parentElement) {
                const containerWidth = svgRef.current.parentElement.clientWidth;
                setDimensions({
                    width: Math.max(containerWidth, 1200),
                    height: height
                });
            }
        };

        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [width, height]);

    useEffect(() => {
        if (!svgRef.current || tasks.length === 0 || !tooltipRef.current) return;

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

        // Créer les nœuds et liens
        const nodes = createPertNodes(tasks);
        const links = createPertLinks(tasks);
        const positionedNodes = layoutPertNodes(nodes, links, { width: innerWidth, height: innerHeight });

        // Échelles pour le positionnement
        const xExtent = d3.extent(positionedNodes, d => d.x || 0) as [number, number];
        const yExtent = d3.extent(positionedNodes, d => d.y || 0) as [number, number];

        const xScale = d3.scaleLinear()
            .domain([xExtent[0] - 50, xExtent[1] + 250])
            .range([0, innerWidth]);

        const yScale = d3.scaleLinear()
            .domain([yExtent[0] - 50, yExtent[1] + 150])
            .range([0, innerHeight]);

        // Dimensions des boîtes PERT selon l'image
        const boxWidth = 180;
        const boxHeight = 80;

        // Définir les marqueurs pour les flèches
        const defs = svg.append('defs');

        // Flèche normale (grise)
        defs.append('marker')
            .attr('id', 'arrow-normal')
            .attr('viewBox', '0 -5 10 10')
            .attr('refX', 8)
            .attr('markerWidth', 6)
            .attr('markerHeight', 6)
            .attr('orient', 'auto')
            .append('path')
            .attr('d', 'M0,-5L10,0L0,5')
            .attr('fill', '#6B7280');

        // Flèche critique (rouge)
        defs.append('marker')
            .attr('id', 'arrow-critical')
            .attr('viewBox', '0 -5 10 10')
            .attr('refX', 8)
            .attr('markerWidth', 6)
            .attr('markerHeight', 6)
            .attr('orient', 'auto')
            .append('path')
            .attr('d', 'M0,-5L10,0L0,5')
            .attr('fill', '#DC2626');

        // Dessiner les liens (flèches) AVANT les nœuds - CORRIGÉ POUR ÊTRE VISIBLES
        g.selectAll('.link')
            .data(links)
            .enter()
            .append('line')
            .attr('class', 'link')
            .attr('x1', d => {
                const sourceNode = positionedNodes.find(n => n.id === d.source);
                return xScale((sourceNode?.x || 0) + boxWidth); // Sortie à droite de la boîte source
            })
            .attr('y1', d => {
                const sourceNode = positionedNodes.find(n => n.id === d.source);
                return yScale((sourceNode?.y || 0) + boxHeight/2); // Milieu vertical
            })
            .attr('x2', d => {
                const targetNode = positionedNodes.find(n => n.id === d.target);
                return xScale(targetNode?.x || 0); // Entrée à gauche de la boîte cible
            })
            .attr('y2', d => {
                const targetNode = positionedNodes.find(n => n.id === d.target);
                return yScale((targetNode?.y || 0) + boxHeight/2); // Milieu vertical
            })
            .attr('stroke', d => {
                const sourceNode = positionedNodes.find(n => n.id === d.source);
                const targetNode = positionedNodes.find(n => n.id === d.target);
                return (sourceNode?.isCritical && targetNode?.isCritical) ? '#DC2626' : '#6B7280';
            })
            .attr('stroke-width', d => {
                const sourceNode = positionedNodes.find(n => n.id === d.source);
                const targetNode = positionedNodes.find(n => n.id === d.target);
                return (sourceNode?.isCritical && targetNode?.isCritical) ? 3 : 2;
            })
            .attr('marker-end', d => {
                const sourceNode = positionedNodes.find(n => n.id === d.source);
                const targetNode = positionedNodes.find(n => n.id === d.target);
                return (sourceNode?.isCritical && targetNode?.isCritical) ? 'url(#arrow-critical)' : 'url(#arrow-normal)';
            });

        // Créer les groupes de nœuds
        const nodeGroups = g.selectAll('.node')
            .data(positionedNodes)
            .enter()
            .append('g')
            .attr('class', 'node')
            .attr('transform', d => `translate(${xScale(d.x || 0)}, ${yScale(d.y || 0)})`)
            .style('cursor', 'pointer');

        // Rectangle principal de la boîte PERT
        nodeGroups.append('rect')
            .attr('width', boxWidth)
            .attr('height', boxHeight)
            .attr('fill', 'white')
            .attr('stroke', d => d.isCritical ? '#DC2626' : '#374151')
            .attr('stroke-width', d => d.isCritical ? 3 : 2)
            .attr('rx', 3)
            .attr('ry', 3);

        // En-tête avec le nom de la tâche
        nodeGroups.append('rect')
            .attr('width', boxWidth)
            .attr('height', 20)
            .attr('fill', d => d.isCritical ? '#DC2626' : '#3B82F6')
            .attr('rx', 3)
            .attr('ry', 3);

        // Corriger le coin inférieur de l'en-tête
        nodeGroups.append('rect')
            .attr('width', boxWidth)
            .attr('height', 10)
            .attr('y', 13)
            .attr('fill', d => d.isCritical ? '#DC2626' : '#3B82F6');

        // Texte du nom de la tâche
        nodeGroups.append('text')
            .attr('x', boxWidth / 2)
            .attr('y', 13)
            .attr('text-anchor', 'middle')
            .attr('dominant-baseline', 'middle')
            .attr('fill', 'white')
            .attr('font-weight', 'bold')
            .attr('font-size', '11px')
            .text(d => {
                const name = d.name || "Unnamed";
                return name.length > 20 ? name.substring(0, 20) + '...' : name;
            });

        // Lignes de séparation pour créer la grille PERT comme dans l'image
        // Ligne horizontale du milieu
        nodeGroups.append('line')
            .attr('x1', 0)
            .attr('y1', 50) // Position du milieu
            .attr('x2', boxWidth)
            .attr('y2', 50)
            .attr('stroke', '#374151')
            .attr('stroke-width', 1);

        // Ligne verticale du milieu
        nodeGroups.append('line')
            .attr('x1', boxWidth / 2)
            .attr('y1', 20)
            .attr('x2', boxWidth / 2)
            .attr('y2', boxHeight)
            .attr('stroke', '#374151')
            .attr('stroke-width', 1);

        // Données PERT selon l'image: ES, EF, LS, LF dans les coins + durée au centre

        // ES (Earliest Start) - Haut Gauche
        nodeGroups.append('text')
            .attr('x', boxWidth / 4)
            .attr('y', 32)
            .attr('text-anchor', 'middle')
            .attr('dominant-baseline', 'middle')
            .attr('font-size', '16px')
            .attr('font-weight', 'bold')
            .attr('fill', '#059669')
            .text(d => d.earliestStart);

        // EF (Earliest Finish) - Haut Droit
        nodeGroups.append('text')
            .attr('x', (boxWidth * 3) / 4)
            .attr('y', 32)
            .attr('text-anchor', 'middle')
            .attr('dominant-baseline', 'middle')
            .attr('font-size', '16px')
            .attr('font-weight', 'bold')
            .attr('fill', '#059669')
            .text(d => d.earliestFinish);

        // LS (Latest Start) - Bas Gauche
        nodeGroups.append('text')
            .attr('x', boxWidth / 4)
            .attr('y', 67)
            .attr('text-anchor', 'middle')
            .attr('dominant-baseline', 'middle')
            .attr('font-size', '16px')
            .attr('font-weight', 'bold')
            .attr('fill', '#DC2626')
            .text(d => d.latestStart);

        // LF (Latest Finish) - Bas Droit
        nodeGroups.append('text')
            .attr('x', (boxWidth * 3) / 4)
            .attr('y', 67)
            .attr('text-anchor', 'middle')
            .attr('dominant-baseline', 'middle')
            .attr('font-size', '16px')
            .attr('font-weight', 'bold')
            .attr('fill', '#DC2626')
            .text(d => d.latestFinish);

        // Durée au centre dans un cercle (comme dans l'image)
        nodeGroups.append('circle')
            .attr('cx', boxWidth / 2)
            .attr('cy', 50)
            .attr('r', 16)
            .attr('fill', d => d.isCritical ? '#FEE2E2' : '#EFF6FF')
            .attr('stroke', d => d.isCritical ? '#DC2626' : '#3B82F6')
            .attr('stroke-width', 2);

        nodeGroups.append('text')
            .attr('x', boxWidth / 2)
            .attr('y', 50)
            .attr('text-anchor', 'middle')
            .attr('dominant-baseline', 'middle')
            .attr('font-size', '14px')
            .attr('font-weight', 'bold')
            .attr('fill', d => d.isCritical ? '#DC2626' : '#3B82F6')
            .text(d => d.duration);

        // ID de la tâche en petit cercle (comme dans l'image)
        nodeGroups.append('circle')
            .attr('cx', 15)
            .attr('cy', 8)
            .attr('r', 10)
            .attr('fill', d => d.isCritical ? '#DC2626' : '#3B82F6')
            .attr('stroke', 'white')
            .attr('stroke-width', 1);

        nodeGroups.append('text')
            .attr('x', 15)
            .attr('y', 8)
            .attr('text-anchor', 'middle')
            .attr('dominant-baseline', 'middle')
            .attr('font-size', '9px')
            .attr('font-weight', 'bold')
            .attr('fill', 'white')
            .text(d => d.id);

        // Événements de souris
        nodeGroups
            .on('mouseover', function(event, d) {
                const task = tasks.find(t => t.id === d.id);
                if (!task) return;

                tooltip
                    .style('opacity', 1)
                    .style('left', (event.pageX + 10) + 'px')
                    .style('top', (event.pageY - 10) + 'px')
                    .html(`
                        <div class="font-bold text-gray-800">${task.name}</div>
                        <div class="text-sm text-gray-600">ID: ${task.id}</div>
                        <div class="text-sm text-gray-600">Durée: ${task.duration} jours</div>
                        <div class="text-sm text-gray-600">ES: ${d.earliestStart} | EF: ${d.earliestFinish}</div>
                        <div class="text-sm text-gray-600">LS: ${d.latestStart} | LF: ${d.latestFinish}</div>
                        <div class="text-sm text-gray-600">Marge: ${d.slack} jours</div>
                        ${d.isCritical ?
                        '<div class="text-sm font-bold text-red-600 mt-1">⚠️ Tâche critique</div>'
                        : '<div class="text-sm text-green-600 mt-1">✅ Tâche non critique</div>'}
                    `);

                d3.select(this).select('rect')
                    .attr('stroke-width', d.isCritical ? 5 : 4);
            })
            .on('mouseout', function(event, d) {
                tooltip.style('opacity', 0);

                d3.select(this).select('rect')
                    .attr('stroke-width', d.isCritical ? 3 : 2);
            })
            .on('click', function(event, d) {
                const task = tasks.find(t => t.id === d.id);
                if (task && onTaskClick) {
                    onTaskClick(task);
                }
            });

        // Légende simplifiée (SANS duplication du chemin critique)
        const legend = svg.append('g')
            .attr('transform', `translate(${margin.left}, 10)`);

        // Titre seulement
        legend.append('text')
            .attr('x', 0)
            .attr('y', 0)
            .attr('font-size', '12px')
            .attr('font-weight', 'bold')
            .attr('fill', '#374151')
            .text('Légende du diagramme PERT:');

        // Exemple de boîte PERT miniature
        const miniBox = legend.append('g')
            .attr('transform', 'translate(200, -15)');

        // Rectangle principal miniature
        miniBox.append('rect')
            .attr('width', 90)
            .attr('height', 50)
            .attr('fill', 'white')
            .attr('stroke', '#374151')
            .attr('stroke-width', 1)
            .attr('rx', 2);

        // En-tête miniature
        miniBox.append('rect')
            .attr('width', 90)
            .attr('height', 12)
            .attr('fill', '#3B82F6')
            .attr('rx', 2);

        miniBox.append('rect')
            .attr('width', 90)
            .attr('height', 6)
            .attr('y', 7)
            .attr('fill', '#3B82F6');

        // Lignes de grille miniature
        miniBox.append('line')
            .attr('x1', 0).attr('y1', 31).attr('x2', 90).attr('y2', 31)
            .attr('stroke', '#374151').attr('stroke-width', 0.5);

        miniBox.append('line')
            .attr('x1', 45).attr('y1', 12).attr('x2', 45).attr('y2', 50)
            .attr('stroke', '#374151').attr('stroke-width', 0.5);

        // Labels explicatifs
        const labels = [
            { x: 22, y: 22, text: 'ES', color: '#059669' },
            { x: 68, y: 22, text: 'EF', color: '#059669' },
            { x: 22, y: 42, text: 'LS', color: '#DC2626' },
            { x: 68, y: 42, text: 'LF', color: '#DC2626' }
        ];

        labels.forEach(label => {
            miniBox.append('text')
                .attr('x', label.x)
                .attr('y', label.y)
                .attr('text-anchor', 'middle')
                .attr('font-size', '7px')
                .attr('font-weight', 'bold')
                .attr('fill', label.color)
                .text(label.text);
        });

        // Durée au centre de l'exemple
        miniBox.append('circle')
            .attr('cx', 45)
            .attr('cy', 31)
            .attr('r', 6)
            .attr('fill', '#EFF6FF')
            .attr('stroke', '#3B82F6')
            .attr('stroke-width', 1);

        miniBox.append('text')
            .attr('x', 45)
            .attr('y', 31)
            .attr('text-anchor', 'middle')
            .attr('dominant-baseline', 'middle')
            .attr('font-size', '5px')
            .attr('font-weight', 'bold')
            .attr('fill', '#3B82F6')
            .text('D');

        // Explications textuelles à droite
        const explanations = [
            'ES = Earliest Start', 'EF = Earliest Finish',
            'LS = Latest Start', 'LF = Latest Finish'
        ];

        explanations.forEach((text, i) => {
            legend.append('text')
                .attr('x', 310)
                .attr('y', i * 10)
                .attr('font-size', '10px')
                .attr('fill', '#6B7280')
                .text(text);
        });

        // Zoom et pan
        const zoom = d3.zoom<SVGSVGElement, unknown>()
            .scaleExtent([0.5, 2])
            .translateExtent([[-200, -200], [dimensions.width + 200, dimensions.height + 200]])
            .on('zoom', (event) => {
                g.attr('transform', `translate(${margin.left},${margin.top}) ${event.transform}`);
            });

        svg.call(zoom);

    }, [tasks, criticalPath, dimensions, onTaskClick]);

    return (
        <div className="relative bg-white rounded-lg border">
            <div className="p-4">
                <div className="text-center mb-2">
                    <h3 className="text-lg font-bold text-gray-800">Diagramme PERT</h3>
                    <p className="text-xs text-gray-600">
                        Utilisez la molette pour zoomer, cliquez-glissez pour naviguer
                    </p>
                </div>

                <svg
                    ref={svgRef}
                    className="w-full"
                    style={{ minHeight: '600px' }}
                ></svg>

                <div
                    ref={tooltipRef}
                    className="absolute bg-white shadow-lg rounded-lg p-3 text-sm pointer-events-none opacity-0 z-10 transition-opacity border max-w-xs"
                ></div>
            </div>
        </div>
    );
}