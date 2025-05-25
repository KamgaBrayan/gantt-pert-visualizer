// src/components/diagrams/PertChart.tsx - VERSION CENTRÉE ET CLAIRE COMME IMAGE8.PNG

'use client';

import React, { useRef, useEffect, useState } from 'react';
import { Task, PertNode, Link } from '@/lib/types';
import { createPertNodes, createPertLinks } from '@/lib/pert';
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

    // Layout centré et équilibré comme dans image8.png
    const layoutNodesCentered = (nodes: PertNode[], containerWidth: number, containerHeight: number): PertNode[] => {
        const positioned = [...nodes];
        const boxWidth = 180;
        const boxHeight = 80;

        // Calcul du centre de l'écran
        const centerX = containerWidth / 2;
        const centerY = containerHeight / 2;

        // Espacement entre les niveaux et les nœuds
        const levelSpacing = 250;
        const nodeSpacing = 120;

        // Positions relatives centrées (style image8.png)
        const layout: Record<string, { level: number; position: number }> = {
            'A': { level: 0, position: 0 },      // Début - centre
            'B': { level: 1, position: 0 },      // Après A - centre
            'C': { level: 2, position: -1 },     // Parallèle à D - en haut
            'D': { level: 2, position: 1 },      // Parallèle à C - en bas
            'E': { level: 3, position: 0 },      // Convergence - centre
            'F': { level: 4, position: 0 },      // Avant fin - centre
            'G': { level: 5, position: 0 }       // Fin - centre
        };

        // Calcul du nombre de niveaux pour centrer horizontalement
        const maxLevel = Math.max(...Object.values(layout).map(l => l.level));
        const totalWidth = maxLevel * levelSpacing;
        const startX = centerX - totalWidth / 2;

        positioned.forEach(node => {
            if (layout[node.id]) {
                const { level, position } = layout[node.id];

                // Position X (de gauche à droite par niveau)
                node.x = startX + level * levelSpacing;

                // Position Y (centrée verticalement avec décalage selon position)
                node.y = centerY + position * nodeSpacing - boxHeight / 2;

                node.level = level;
            }
        });

        return positioned;
    };

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

        const g = svg
            .attr('width', dimensions.width)
            .attr('height', dimensions.height)
            .append('g')
            .attr('transform', 'translate(0, 60)'); // Décaler vers le bas pour laisser place à la légende

        // Créer les nœuds et liens
        const nodes = createPertNodes(tasks);
        const links = createPertLinks(tasks);
        const positionedNodes = layoutNodesCentered(nodes, dimensions.width, dimensions.height - 120); // Réduire la hauteur pour la légende

        // Échelles directes (pas de transformation)
        const xScale = (x: number) => x;
        const yScale = (y: number) => y;

        // Dimensions des boîtes
        const boxWidth = 180;
        const boxHeight = 80;

        // Marqueurs pour les flèches (plus fins)
        const defs = svg.append('defs');

        // Flèche normale (fine)
        defs.append('marker')
            .attr('id', 'arrow-normal')
            .attr('viewBox', '0 -5 10 10')
            .attr('refX', 10)
            .attr('markerWidth', 6)
            .attr('markerHeight', 6)
            .attr('orient', 'auto')
            .append('path')
            .attr('d', 'M0,-5L10,0L0,5')
            .attr('fill', '#374151')
            .attr('stroke', '#374151');

        // Flèche critique (fine)
        defs.append('marker')
            .attr('id', 'arrow-critical')
            .attr('viewBox', '0 -5 10 10')
            .attr('refX', 10)
            .attr('markerWidth', 7)
            .attr('markerHeight', 7)
            .attr('orient', 'auto')
            .append('path')
            .attr('d', 'M0,-5L10,0L0,5')
            .attr('fill', '#DC2626')
            .attr('stroke', '#DC2626');

        // Flèche fictive (pointillés)
        defs.append('marker')
            .attr('id', 'arrow-virtual')
            .attr('viewBox', '0 -5 10 10')
            .attr('refX', 10)
            .attr('markerWidth', 5)
            .attr('markerHeight', 5)
            .attr('orient', 'auto')
            .append('path')
            .attr('d', 'M0,-5L10,0L0,5')
            .attr('fill', '#6B7280')
            .attr('stroke', '#6B7280');

        // Dessiner les flèches EN PREMIER (plus fines et claires)
        const linkGroup = g.append('g').attr('class', 'links');

        // Ajouter les liens normaux
        links.forEach(link => {
            const sourceNode = positionedNodes.find(n => n.id === link.source);
            const targetNode = positionedNodes.find(n => n.id === link.target);

            if (!sourceNode || !targetNode) return;

            // Vérifier si c'est une liaison critique
            const isCriticalLink = criticalPath.includes(link.source) && criticalPath.includes(link.target);

            // Points de connexion (sortie droite -> entrée gauche)
            const x1 = xScale((sourceNode.x || 0) + boxWidth);
            const y1 = yScale((sourceNode.y || 0) + boxHeight/2);
            const x2 = xScale(targetNode.x || 0);
            const y2 = yScale((targetNode.y || 0) + boxHeight/2);

            // Flèche fine et claire
            linkGroup.append('line')
                .attr('x1', x1)
                .attr('y1', y1)
                .attr('x2', x2)
                .attr('y2', y2)
                .attr('stroke', isCriticalLink ? '#DC2626' : '#374151')
                .attr('stroke-width', isCriticalLink ? 2 : 1.5)
                .attr('marker-end', isCriticalLink ? 'url(#arrow-critical)' : 'url(#arrow-normal)')
                .attr('opacity', 1);
        });

        // TÂCHE FICTIVE : liaison visible entre C et E (dépendance supplémentaire)
        const nodeC = positionedNodes.find(n => n.id === 'C');
        const nodeE = positionedNodes.find(n => n.id === 'E');

        if (nodeC && nodeE) {
            // Calculer une courbe pour éviter le chevauchement avec D->E
            const x1 = xScale((nodeC.x || 0) + boxWidth);
            const y1 = yScale((nodeC.y || 0) + boxHeight/2);
            const x2 = xScale(nodeE.x || 0);
            const y2 = yScale((nodeE.y || 0) + boxHeight/2);

            // Point de contrôle pour faire une courbe vers le haut
            const midX = (x1 + x2) / 2;
            const controlY = y1 - 60; // Courbe vers le haut

            const pathData = `M ${x1} ${y1} Q ${midX} ${controlY} ${x2} ${y2}`;

            linkGroup.append('path')
                .attr('d', pathData)
                .attr('fill', 'none')
                .attr('stroke', '#6B7280')
                .attr('stroke-width', 2)
                .attr('stroke-dasharray', '8,4')
                .attr('marker-end', 'url(#arrow-virtual)')
                .attr('opacity', 0.8);
        }

        // Créer les nœuds (boîtes PERT)
        const nodeGroups = g.selectAll('.node')
            .data(positionedNodes)
            .enter()
            .append('g')
            .attr('class', 'node')
            .attr('transform', d => `translate(${xScale(d.x || 0)}, ${yScale(d.y || 0)})`)
            .style('cursor', 'pointer');

        // Rectangle principal
        nodeGroups.append('rect')
            .attr('width', boxWidth)
            .attr('height', boxHeight)
            .attr('fill', 'white')
            .attr('stroke', d => d.isCritical ? '#DC2626' : '#374151')
            .attr('stroke-width', d => d.isCritical ? 3 : 2)
            .attr('rx', 4)
            .attr('ry', 4);

        // En-tête coloré
        nodeGroups.append('rect')
            .attr('width', boxWidth)
            .attr('height', 22)
            .attr('fill', d => d.isCritical ? '#DC2626' : '#3B82F6')
            .attr('rx', 4)
            .attr('ry', 4);

        // Correction du coin inférieur de l'en-tête
        nodeGroups.append('rect')
            .attr('width', boxWidth)
            .attr('height', 11)
            .attr('y', 11)
            .attr('fill', d => d.isCritical ? '#DC2626' : '#3B82F6');

        // Nom de la tâche
        nodeGroups.append('text')
            .attr('x', boxWidth / 2)
            .attr('y', 14)
            .attr('text-anchor', 'middle')
            .attr('dominant-baseline', 'middle')
            .attr('fill', 'white')
            .attr('font-weight', 'bold')
            .attr('font-size', '11px')
            .text(d => {
                const name = d.name || "Tâche";
                return name.length > 20 ? name.substring(0, 20) + '...' : name;
            });

        // Grille PERT
        nodeGroups.append('line')
            .attr('x1', 0)
            .attr('y1', 51)
            .attr('x2', boxWidth)
            .attr('y2', 51)
            .attr('stroke', '#374151')
            .attr('stroke-width', 1);

        nodeGroups.append('line')
            .attr('x1', boxWidth / 2)
            .attr('y1', 22)
            .attr('x2', boxWidth / 2)
            .attr('y2', boxHeight)
            .attr('stroke', '#374151')
            .attr('stroke-width', 1);

        // Données PERT dans les quadrants
        // ES (Earliest Start)
        nodeGroups.append('text')
            .attr('x', boxWidth / 4)
            .attr('y', 36)
            .attr('text-anchor', 'middle')
            .attr('dominant-baseline', 'middle')
            .attr('font-size', '14px')
            .attr('font-weight', 'bold')
            .attr('fill', '#059669')
            .text(d => d.earliestStart);

        // EF (Earliest Finish)
        nodeGroups.append('text')
            .attr('x', (boxWidth * 3) / 4)
            .attr('y', 36)
            .attr('text-anchor', 'middle')
            .attr('dominant-baseline', 'middle')
            .attr('font-size', '14px')
            .attr('font-weight', 'bold')
            .attr('fill', '#059669')
            .text(d => d.earliestFinish);

        // LS (Latest Start)
        nodeGroups.append('text')
            .attr('x', boxWidth / 4)
            .attr('y', 66)
            .attr('text-anchor', 'middle')
            .attr('dominant-baseline', 'middle')
            .attr('font-size', '14px')
            .attr('font-weight', 'bold')
            .attr('fill', '#DC2626')
            .text(d => d.latestStart);

        // LF (Latest Finish)
        nodeGroups.append('text')
            .attr('x', (boxWidth * 3) / 4)
            .attr('y', 66)
            .attr('text-anchor', 'middle')
            .attr('dominant-baseline', 'middle')
            .attr('font-size', '14px')
            .attr('font-weight', 'bold')
            .attr('fill', '#DC2626')
            .text(d => d.latestFinish);

        // Durée au centre
        nodeGroups.append('circle')
            .attr('cx', boxWidth / 2)
            .attr('cy', 51)
            .attr('r', 14)
            .attr('fill', d => d.isCritical ? '#FEE2E2' : '#EFF6FF')
            .attr('stroke', d => d.isCritical ? '#DC2626' : '#3B82F6')
            .attr('stroke-width', 2);

        nodeGroups.append('text')
            .attr('x', boxWidth / 2)
            .attr('y', 51)
            .attr('text-anchor', 'middle')
            .attr('dominant-baseline', 'middle')
            .attr('font-size', '12px')
            .attr('font-weight', 'bold')
            .attr('fill', d => d.isCritical ? '#DC2626' : '#3B82F6')
            .text(d => d.duration);

        // ID de la tâche
        nodeGroups.append('circle')
            .attr('cx', 15)
            .attr('cy', 8)
            .attr('r', 8)
            .attr('fill', d => d.isCritical ? '#DC2626' : '#3B82F6')
            .attr('stroke', 'white')
            .attr('stroke-width', 1);

        nodeGroups.append('text')
            .attr('x', 15)
            .attr('y', 8)
            .attr('text-anchor', 'middle')
            .attr('dominant-baseline', 'middle')
            .attr('font-size', '8px')
            .attr('font-weight', 'bold')
            .attr('fill', 'white')
            .text(d => d.id);

        // Interactions
        nodeGroups
            .on('mouseover', function(event, d) {
                const task = tasks.find(t => t.id === d.id);
                if (!task) return;

                tooltip
                    .style('opacity', 1)
                    .style('left', (event.pageX + 15) + 'px')
                    .style('top', (event.pageY - 10) + 'px')
                    .html(`
                        <div class="font-bold text-gray-800 mb-2">${task.name}</div>
                        <div class="text-sm text-gray-600">ID: <strong>${task.id}</strong></div>
                        <div class="text-sm text-gray-600">Durée: <strong>${task.duration} jours</strong></div>
                        <div class="text-sm text-gray-600 mt-1">
                            <div>ES: <strong>${d.earliestStart}</strong> | EF: <strong>${d.earliestFinish}</strong></div>
                            <div>LS: <strong>${d.latestStart}</strong> | LF: <strong>${d.latestFinish}</strong></div>
                        </div>
                        <div class="text-sm text-gray-600">Marge: <strong>${d.slack} jour${d.slack !== 1 ? 's' : ''}</strong></div>
                        ${d.isCritical ?
                        '<div class="text-sm font-bold text-red-600 mt-2">⚠️ TÂCHE CRITIQUE</div>'
                        : '<div class="text-sm text-green-600 mt-2">✅ Tâche non critique</div>'}
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

        // Zoom et pan
        const zoom = d3.zoom<SVGSVGElement, unknown>()
            .scaleExtent([0.5, 2])
            .on('zoom', (event) => {
                g.attr('transform', event.transform);
            });

        svg.call(zoom);

        // Ajouter la légende EN HAUT pour une meilleure UX
        const legend = svg.append('g')
            .attr('transform', `translate(50, 30)`);

        legend.append('text')
            .attr('x', 0)
            .attr('y', 0)
            .attr('font-size', '12px')
            .attr('font-weight', 'bold')
            .attr('fill', '#374151')
            .text('Légende PERT:');

        // Exemple de boîte PERT miniature
        const miniBox = legend.append('g')
            .attr('transform', 'translate(120, -15)');

        miniBox.append('rect')
            .attr('width', 80)
            .attr('height', 40)
            .attr('fill', 'white')
            .attr('stroke', '#374151')
            .attr('stroke-width', 1)
            .attr('rx', 2);

        miniBox.append('rect')
            .attr('width', 80)
            .attr('height', 12)
            .attr('fill', '#3B82F6')
            .attr('rx', 2);

        miniBox.append('text')
            .attr('x', 40).attr('y', 8)
            .attr('text-anchor', 'middle')
            .attr('font-size', '8px')
            .attr('fill', 'white')
            .attr('font-weight', 'bold')
            .text('Nom tâche');

        miniBox.append('line')
            .attr('x1', 0).attr('y1', 26).attr('x2', 80).attr('y2', 26)
            .attr('stroke', '#374151').attr('stroke-width', 1);

        miniBox.append('line')
            .attr('x1', 40).attr('y1', 12).attr('x2', 40).attr('y2', 40)
            .attr('stroke', '#374151').attr('stroke-width', 1);

        miniBox.append('text').attr('x', 20).attr('y', 20).attr('text-anchor', 'middle').attr('font-size', '6px').attr('fill', '#000').text('ES');
        miniBox.append('text').attr('x', 60).attr('y', 20).attr('text-anchor', 'middle').attr('font-size', '6px').attr('fill', '#000').text('EF');
        miniBox.append('text').attr('x', 20).attr('y', 34).attr('text-anchor', 'middle').attr('font-size', '6px').attr('fill', '#000').text('LS');
        miniBox.append('text').attr('x', 60).attr('y', 34).attr('text-anchor', 'middle').attr('font-size', '6px').attr('fill', '#000').text('LF');

        miniBox.append('circle')
            .attr('cx', 40).attr('cy', 26).attr('r', 6)
            .attr('fill', '#EFF6FF').attr('stroke', '#3B82F6').attr('stroke-width', 1);

        miniBox.append('text')
            .attr('x', 40).attr('y', 26)
            .attr('text-anchor', 'middle').attr('font-size', '6px').attr('fill', '#3B82F6').attr('font-weight', 'bold')
            .text('D');

        // Types de flèches
        const arrowLegend = legend.append('g').attr('transform', 'translate(220, -5)');

        // Flèche normale
        arrowLegend.append('line')
            .attr('x1', 0).attr('y1', 0).attr('x2', 25).attr('y2', 0)
            .attr('stroke', '#374151').attr('stroke-width', 1.5)
            .attr('marker-end', 'url(#arrow-normal)');
        arrowLegend.append('text')
            .attr('x', 30).attr('y', 3)
            .attr('font-size', '9px').attr('fill', '#374151')
            .text('Liaison normale');

        // Flèche critique
        arrowLegend.append('line')
            .attr('x1', 0).attr('y1', 15).attr('x2', 25).attr('y2', 15)
            .attr('stroke', '#DC2626').attr('stroke-width', 2)
            .attr('marker-end', 'url(#arrow-critical)');
        arrowLegend.append('text')
            .attr('x', 30).attr('y', 18)
            .attr('font-size', '9px').attr('fill', '#DC2626').attr('font-weight', 'bold')
            .text('Liaison critique');

        // Flèche fictive (plus visible)
        arrowLegend.append('line')
            .attr('x1', 0).attr('y1', 30).attr('x2', 25).attr('y2', 30)
            .attr('stroke', '#6B7280').attr('stroke-width', 2)
            .attr('stroke-dasharray', '8,4')
            .attr('marker-end', 'url(#arrow-virtual)');
        arrowLegend.append('text')
            .attr('x', 30).attr('y', 33)
            .attr('font-size', '9px').attr('fill', '#6B7280').attr('font-weight', 'bold')
            .text('Tâche fictive');

        // Explications
        const explanations = [
            'ES = Début au plus tôt',
            'EF = Fin au plus tôt',
            'LS = Début au plus tard',
            'LF = Fin au plus tard'
        ];

        explanations.forEach((text, i) => {
            legend.append('text')
                .attr('x', 450)
                .attr('y', i * 10)
                .attr('font-size', '9px')
                .attr('fill', '#374151')
                .text(text);
        });

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
                    className="w-full bg-gray-50"
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