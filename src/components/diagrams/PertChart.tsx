'use client';

import React, { useRef, useEffect, useState } from 'react';
import { Task } from '@/lib/types';
// formatDuration is not used in the provided snippet for completion.
// import { formatDuration } from '@/lib/utils';
import * as d3 from 'd3';

interface PertChartProps {
  tasks: Task[];
  criticalPath?: string[]; // Note: criticalPath prop is not directly used for drawing; criticality is derived.
  width?: number;
  height?: number;
  onTaskClick?: (task: Task, taskMetaData: TaskMetaData | undefined) => void; // Modified to include metadata
}

// Represents an Event in the AOA diagram (a point in time)
interface PertEventNode {
  id: string;
  earliestOccurrence: number; // EO
  latestOccurrence: number;   // LO
  label: string;
  isCritical: boolean;
  x?: number;
  y?: number;
}

// Represents an Activity in the AOA diagram (a task, shown on an arrow)
interface PertActivityLink {
  id: string;
  sourceEventId: string;
  targetEventId: string;
  task: Task; // Original Task object or a dummy task
  isCritical: boolean;
  isDummy: boolean;
  // Metadata will be calculated and added here for non-dummy activities
  metaData?: TaskMetaData;
}

// Metadata for each task (activity)
interface TaskMetaData {
  id: string; // Task ID
  name: string;
  duration: number;
  earliestStart: number;  // ES = EO of source event
  earliestFinish: number; // EF = ES + duration
  latestStart: number;    // LS = LF - duration
  latestFinish: number;   // LF = LO of target event
  totalSlack: number;     // TS = LS - ES (or LF - EF)
  freeSlack: number;      // FS = EO of target event - EO of source event - duration
  isCritical: boolean;
}


function createAOAStructureAndCalculateTimes(tasks: Task[]): {
  eventNodes: PertEventNode[];
  activityLinks: PertActivityLink[];
} {
  const eventNodes: PertEventNode[] = [];
  const activityLinks: PertActivityLink[] = [];
  const eventNodeMap = new Map<string, PertEventNode>();
  let eventIdCounter = 0;

  const getOrCreateEventNode = (suggestedId?: string, labelOverride?: string): PertEventNode => {
    const id = suggestedId || `E${eventIdCounter++}`;
    if (eventNodeMap.has(id)) {
      return eventNodeMap.get(id)!;
    }
    const newEventNode: PertEventNode = {
      id,
      earliestOccurrence: 0,
      latestOccurrence: Infinity,
      label: labelOverride || id,
      isCritical: false,
    };
    eventNodeMap.set(id, newEventNode);
    eventNodes.push(newEventNode);
    return newEventNode;
  };

  if (tasks.length === 0) {
    return { eventNodes, activityLinks };
  }

  const globalStartEvent = getOrCreateEventNode('global_start_event', 'Début');
  const globalEndEvent = getOrCreateEventNode('global_end_event', 'Fin');

  const taskCompletionEventMap = new Map<string, string>();
  tasks.forEach(task => {
    const taskEndEvent = getOrCreateEventNode(`event_task_end_${task.id}`, `Fin ${task.name.substring(0,4)}.`);
    taskCompletionEventMap.set(task.id, taskEndEvent.id);
  });

  tasks.forEach(task => {
    let sourceEventIdForActivity: string;
    const taskActualEndEventId = taskCompletionEventMap.get(task.id)!;

    if (task.predecessors.length === 0) {
      sourceEventIdForActivity = globalStartEvent.id;
    } else {
      const junctionEventId = `event_junction_before_${task.id}`;
      const junctionEvent = getOrCreateEventNode(junctionEventId, `Début ${task.name.substring(0,4)}.`);
      sourceEventIdForActivity = junctionEvent.id;

      task.predecessors.forEach(predTaskId => {
        const predTaskCompletionEventId = taskCompletionEventMap.get(predTaskId);
        if (predTaskCompletionEventId) {
          activityLinks.push({
            id: `dummy_${predTaskId}_to_${junctionEventId}`,
            sourceEventId: predTaskCompletionEventId,
            targetEventId: junctionEvent.id,
            task: { id: `dummy_${predTaskId}_to_${junctionEventId}`, name: `Fictive vers ${task.name.substring(0,4)}.`, duration: 0, predecessors: [] },
            isCritical: false,
            isDummy: true,
          });
        }
      });
    }

    activityLinks.push({
      id: task.id,
      sourceEventId: sourceEventIdForActivity,
      targetEventId: taskActualEndEventId,
      task: task,
      isCritical: false,
      isDummy: false,
    });
  });

  tasks.forEach(task => {
    const hasSuccessors = tasks.some(succ => succ.predecessors.includes(task.id));
    if (!hasSuccessors) {
      const taskActualEndEventId = taskCompletionEventMap.get(task.id)!;
      activityLinks.push({
        id: `dummy_${task.id}_to_global_end`,
        sourceEventId: taskActualEndEventId,
        targetEventId: globalEndEvent.id,
        task: { id: `dummy_${task.id}_to_global_end`, name: `Fictive depuis ${task.name.substring(0,4)}.`, duration: 0, predecessors: [] },
        isCritical: false,
        isDummy: true,
      });
    }
  });

  // Forward Pass (EO)
  let eoChanged = true;
  let eoIterations = 0;
  const maxIterations = eventNodes.length * eventNodes.length;
  globalStartEvent.earliestOccurrence = 0;

  while (eoChanged && eoIterations < maxIterations) {
    eoChanged = false;
    eoIterations++;
    eventNodes.forEach(eventNode => {
      if (eventNode.id === globalStartEvent.id) return;
      let maxPrevEF = 0;
      const incomingActivities = activityLinks.filter(link => link.targetEventId === eventNode.id);
      if (incomingActivities.length > 0) {
        incomingActivities.forEach(activity => {
          const sourceEvent = eventNodeMap.get(activity.sourceEventId);
          if (sourceEvent) {
            maxPrevEF = Math.max(maxPrevEF, sourceEvent.earliestOccurrence + activity.task.duration);
          }
        });
      }
      if (eventNode.earliestOccurrence < maxPrevEF) {
        eventNode.earliestOccurrence = maxPrevEF;
        eoChanged = true;
      }
    });
  }

  // Backward Pass (LO)
  const projectDuration = globalEndEvent.earliestOccurrence;
  globalEndEvent.latestOccurrence = projectDuration;
  eventNodes.forEach(eventNode => {
    if (eventNode.id !== globalEndEvent.id) eventNode.latestOccurrence = projectDuration;
  });
  if(globalStartEvent) globalStartEvent.latestOccurrence = 0;


  let loChanged = true;
  let loIterations = 0;
  const eventIdsInReverseOrder = [...eventNodes].sort((a,b) => b.earliestOccurrence - a.earliestOccurrence).map(n => n.id);

  while (loChanged && loIterations < maxIterations) {
    loChanged = false;
    loIterations++;
    for(const eventId of eventIdsInReverseOrder) {
        const eventNode = eventNodeMap.get(eventId)!;
        if (eventNode.id === globalEndEvent.id) continue;
        let minSuccLS = projectDuration;
        const outgoingActivities = activityLinks.filter(link => link.sourceEventId === eventNode.id);
        if (outgoingActivities.length > 0) {
            outgoingActivities.forEach(activity => {
                const targetEvent = eventNodeMap.get(activity.targetEventId);
                if (targetEvent) {
                    minSuccLS = Math.min(minSuccLS, targetEvent.latestOccurrence - activity.task.duration);
                }
            });
        } else if (eventNode.id !== globalEndEvent.id) {
             minSuccLS = projectDuration;
        }
        if (eventNode.latestOccurrence > minSuccLS) {
            eventNode.latestOccurrence = minSuccLS;
            loChanged = true;
        }
    }
  }

  // Calculate Criticality and Task MetaData
  const epsilon = 0.01;
  eventNodes.forEach(eventNode => {
    eventNode.isCritical = Math.abs(eventNode.earliestOccurrence - eventNode.latestOccurrence) < epsilon;
  });

  activityLinks.forEach(link => {
    const sourceEvent = eventNodeMap.get(link.sourceEventId)!;
    const targetEvent = eventNodeMap.get(link.targetEventId)!;

    const ES = sourceEvent.earliestOccurrence;
    const EF = ES + link.task.duration;
    const LF = targetEvent.latestOccurrence;
    const LS = LF - link.task.duration;
    const totalSlack = LS - ES; // or LF - EF
    // Free Slack for an activity (i,j) = EO_j - EO_i - D_ij
    const freeSlack = targetEvent.earliestOccurrence - sourceEvent.earliestOccurrence - link.task.duration;

    link.isCritical =
      sourceEvent.isCritical &&
      targetEvent.isCritical &&
      Math.abs(totalSlack) < epsilon;
      // Math.abs(targetEvent.latestOccurrence - sourceEvent.earliestOccurrence - link.task.duration) < epsilon;
    
    if (link.isDummy && sourceEvent.isCritical && targetEvent.isCritical && Math.abs(sourceEvent.earliestOccurrence - targetEvent.earliestOccurrence) < epsilon) {
        link.isCritical = true;
    }

    if (!link.isDummy) {
      link.metaData = {
        id: link.task.id,
        name: link.task.name,
        duration: link.task.duration,
        earliestStart: ES,
        earliestFinish: EF,
        latestStart: LS,
        latestFinish: LF,
        totalSlack: Math.max(0, parseFloat(totalSlack.toFixed(2))), // Avoid -0.00 issues
        freeSlack: Math.max(0, parseFloat(freeSlack.toFixed(2))),   // Avoid -0.00 issues
        isCritical: link.isCritical,
      };
    }
  });
  
  if(globalStartEvent) globalStartEvent.isCritical = Math.abs(globalStartEvent.earliestOccurrence - globalStartEvent.latestOccurrence) < epsilon;
  if(globalEndEvent) globalEndEvent.isCritical = Math.abs(globalEndEvent.earliestOccurrence - globalEndEvent.latestOccurrence) < epsilon;

  return { eventNodes, activityLinks };
}


function layoutEventNodes(eventNodes: PertEventNode[], activityLinks: PertActivityLink[]): PertEventNode[] {
  const positionedNodes = [...eventNodes];
  if (eventNodes.length === 0) return [];

  const levels = new Map<string, number>();
  const nodeSuccessors = new Map<string, string[]>();

  activityLinks.forEach(link => {
    if (!nodeSuccessors.has(link.sourceEventId)) {
      nodeSuccessors.set(link.sourceEventId, []);
    }
    nodeSuccessors.get(link.sourceEventId)!.push(link.targetEventId);
  });

  const queue: string[] = [];
  eventNodes.forEach(node => {
    levels.set(node.id, 0);
    const isSourceNode = !activityLinks.some(link => link.targetEventId === node.id);
    if (isSourceNode) {
      queue.push(node.id);
    }
  });
  if (eventNodes.find(n => n.id === 'global_start_event') && !queue.includes('global_start_event') && !activityLinks.some(l => l.targetEventId === 'global_start_event')){
      if (queue.length > 0 && (levels.get(queue[0]) || 0) > 0) {
        levels.set('global_start_event',0);
      } else if (queue.length === 0) {
        queue.push('global_start_event');
        levels.set('global_start_event',0);
      }
  }

  let head = 0;
  while(head < queue.length) {
    const u = queue[head++];
    const uLevel = levels.get(u) || 0;
    (nodeSuccessors.get(u) || []).forEach(vId => {
      const currentVLevel = levels.get(vId) || 0;
      levels.set(vId, Math.max(currentVLevel, uLevel + 1));
      if (!queue.slice(head).includes(vId) && !queue.slice(0,head).includes(vId)) {
          queue.push(vId);
      }
    });
  }

  const levelGroups = new Map<number, string[]>();
  levels.forEach((level, nodeId) => {
    if (!levelGroups.has(level)) levelGroups.set(level, []);
    levelGroups.get(level)!.push(nodeId);
  });

  const levelWidth = 200;
  const nodeSpacing = 120;

  positionedNodes.forEach(node => {
    const level = levels.get(node.id) || 0;
    const nodesAtLevel = levelGroups.get(level) || [node.id];
    nodesAtLevel.sort((a,b) => {
        const nodeA = positionedNodes.find(n=>n.id === a);
        const nodeB = positionedNodes.find(n=>n.id === b);
        return (nodeA?.earliestOccurrence ?? 0) - (nodeB?.earliestOccurrence ?? 0) || a.localeCompare(b);
    });
    const indexInLevel = nodesAtLevel.indexOf(node.id);

    node.x = level * levelWidth;
    node.y = (indexInLevel - (nodesAtLevel.length - 1) / 2) * nodeSpacing;
  });

  return positionedNodes;
}


export default function PertChart({
  tasks,
  width = 900,
  height = 600,
  onTaskClick
}: PertChartProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width, height });
  const [isLoading, setIsLoading] = useState(true);
  const [graphData, setGraphData] = useState<{ eventNodes: PertEventNode[], activityLinks: PertActivityLink[] } | null>(null);

  const margin = { top: 80, right: 60, bottom: 60, left: 60 };
  
  const colors = {
    primary: '#040642', secondary: '#6d38e0', accent: '#198eb4',
    background: '#fafbfc', surface: '#ffffff', surfaceHover: '#f8fafc',
    text: '#1a202c', textSecondary: '#4a5568', textMuted: '#718096',
    border: '#e2e8f0', borderHover: '#cbd5e0',
    success: '#48bb78', warning: '#ed8936', critical: '#e53e3e',
    dummyLink: '#b0bec5'
  };
  
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
    const timer = setTimeout(handleResize, 50);
    window.addEventListener('resize', handleResize);
    return () => { clearTimeout(timer); window.removeEventListener('resize', handleResize); };
  }, [width, height]);

  useEffect(() => {
    setIsLoading(true);
    if (tasks && tasks.length > 0) {
        const data = createAOAStructureAndCalculateTimes(tasks);
        setGraphData(data);
    } else {
        setGraphData(null);
    }
    setIsLoading(false);
  }, [tasks]);
  
  useEffect(() => {
    if (!svgRef.current || isLoading) return;
    
    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();
    
    if (!graphData || graphData.eventNodes.length === 0) {
        if (!isLoading) {
             const g = svg.attr('width', dimensions.width).attr('height', dimensions.height)
                .append('g').attr('transform', `translate(${dimensions.width / 2},${dimensions.height / 2})`);
            g.append('text').text(tasks.length === 0 ? 'Aucune tâche à afficher.' : 'Préparation du diagramme...')
                .attr('text-anchor', 'middle').attr('font-family', 'Inter, system-ui, sans-serif').attr('fill', colors.textMuted);
        }
        return;
    }

    const { eventNodes: rawEventNodes, activityLinks } = graphData;
    const positionedEventNodes = layoutEventNodes(rawEventNodes, activityLinks);
    
    const tooltip = d3.select(tooltipRef.current);
    const innerWidth = dimensions.width - margin.left - margin.right;
    const innerHeight = dimensions.height - margin.top - margin.bottom;
    
    const g = svg.attr('width', dimensions.width).attr('height', dimensions.height)
      .append('g').attr('transform', `translate(${margin.left},${margin.top})`);
    
    const defs = svg.append('defs');
    const normalGradient = defs.append('linearGradient').attr('id', 'normalGradient').attr('x1', '0%').attr('y1', '0%').attr('x2', '100%').attr('y2', '100%');
    normalGradient.append('stop').attr('offset', '0%').style('stop-color', colors.surface).style('stop-opacity', 1);
    normalGradient.append('stop').attr('offset', '100%').style('stop-color', '#f7fafc').style('stop-opacity', 1);
    const criticalGradient = defs.append('linearGradient').attr('id', 'criticalGradient').attr('x1', '0%').attr('y1', '0%').attr('x2', '100%').attr('y2', '100%');
    criticalGradient.append('stop').attr('offset', '0%').style('stop-color', '#fff5f5').style('stop-opacity', 1);
    criticalGradient.append('stop').attr('offset', '100%').style('stop-color', '#fed7d7').style('stop-opacity', 1);
    const shadowFilter = defs.append('filter').attr('id', 'shadow').attr('x', '-50%').attr('y', '-50%').attr('width', '200%').attr('height', '200%');
    shadowFilter.append('feDropShadow').attr('dx', 0).attr('dy', 4).attr('stdDeviation', 6).attr('flood-color', colors.primary).attr('flood-opacity', 0.15);
    const glowFilter = defs.append('filter').attr('id', 'glow').attr('x', '-50%').attr('y', '-50%').attr('width', '200%').attr('height', '200%');
    glowFilter.append('feGaussianBlur').attr('stdDeviation', 4).attr('result', 'coloredBlur').attr('flood-color', colors.critical).attr('flood-opacity', 0.75);
    const feMerge = glowFilter.append('feMerge');
    feMerge.append('feMergeNode').attr('in', 'coloredBlur');
    feMerge.append('feMergeNode').attr('in', 'SourceGraphic');

    const xValues = positionedEventNodes.map(d => d.x || 0);
    const yValues = positionedEventNodes.map(d => d.y || 0);
    const xExtent = d3.extent(xValues) as [number, number] || [0,0];
    const yExtent = d3.extent(yValues) as [number, number] || [0,0];
    
    const nodeRadius = 30;
    const arrowMarkerSize = 7;

    const xScale = d3.scaleLinear()
      .domain([xExtent[0] - nodeRadius, xExtent[1] + nodeRadius])
      .range([nodeRadius, innerWidth - nodeRadius]);
    const yScale = d3.scaleLinear()
      .domain([yExtent[0] - nodeRadius, yExtent[1] + nodeRadius])
      .range([nodeRadius, innerHeight - nodeRadius]);

    if (positionedEventNodes.length <= 1) {
        xScale.domain([-innerWidth / 2, innerWidth / 2]);
        yScale.domain([-innerHeight / 2, innerHeight / 2]);
    }

    const addArrowMarker = (id: string, color: string, size: number) => {
      const marker = defs.append('marker').attr('id', id)
        .attr('viewBox', `0 -${size/2} ${size} ${size}`)
        .attr('refX', size).attr('markerWidth', size).attr('markerHeight', size)
        .attr('orient', 'auto-start-reverse');
      marker.append('path').attr('d', `M0,-${size/2}L${size},0L0,${size/2}`).attr('fill', color);
    };
    addArrowMarker('arrow-normal', colors.textMuted, arrowMarkerSize);
    addArrowMarker('arrow-critical', colors.critical, arrowMarkerSize * 1.1);
    addArrowMarker('arrow-dummy', colors.dummyLink, arrowMarkerSize * 0.9);
    addArrowMarker('arrow-dummy-critical', colors.critical, arrowMarkerSize);

    const linkGroups = g.selectAll('.link-group').data(activityLinks).enter()
      .append('g').attr('class', 'link-group').style('cursor', d => d.isDummy ? 'default' : 'pointer');

    linkGroups.append('path').attr('class', 'link-path')
      .attr('d', d => {
        const sourceNode = positionedEventNodes.find(n => n.id === d.sourceEventId);
        const targetNode = positionedEventNodes.find(n => n.id === d.targetEventId);
        if (!sourceNode || !targetNode || typeof sourceNode.x !== 'number' || typeof targetNode.x !== 'number' ) return '';
        const sx = xScale(sourceNode.x); const sy = yScale(sourceNode.y);
        const tx = xScale(targetNode.x); const ty = yScale(targetNode.y);
        const dx = tx - sx; const dy = ty - sy;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist === 0) return '';
        const sourcePadding = nodeRadius; const targetPadding = nodeRadius + arrowMarkerSize;
        const sourceX = sx + (dx * sourcePadding) / dist; const sourceY = sy + (dy * sourcePadding) / dist;
        const targetX = tx - (dx * targetPadding) / dist; const targetY = ty - (dy * targetPadding) / dist;
        return `M${sourceX},${sourceY}L${targetX},${targetY}`;
      })
      .attr('fill', 'none')
      .attr('stroke', d => d.isCritical ? colors.critical : (d.isDummy ? colors.dummyLink : colors.textMuted))
      .attr('stroke-width', d => d.isCritical ? 2.5 : (d.isDummy ? 1.5 : 2))
      .attr('stroke-dasharray', d => d.isDummy ? '4,4' : '0')
      .attr('marker-end', d => d.isCritical ? (d.isDummy ? 'url(#arrow-dummy-critical)' : 'url(#arrow-critical)') : (d.isDummy ? 'url(#arrow-dummy)' : 'url(#arrow-normal)'))
      .attr('filter', d => d.isCritical && !d.isDummy ? 'url(#glow)' : 'none');

    const activityLabelWidth = 60; const activityLabelHeight = 36;
    linkGroups.filter(d => !d.isDummy).each(function(d) {
        const group = d3.select(this);
        const sourceNode = positionedEventNodes.find(n => n.id === d.sourceEventId);
        const targetNode = positionedEventNodes.find(n => n.id === d.targetEventId);
        if (!sourceNode || !targetNode || typeof sourceNode.x !== 'number' || typeof targetNode.x !== 'number' ) return;
        const midX = (xScale(sourceNode.x) + xScale(targetNode.x)) / 2;
        const midY = (yScale(sourceNode.y) + yScale(targetNode.y)) / 2;
        group.append('rect').attr('x', midX - activityLabelWidth / 2).attr('y', midY - activityLabelHeight / 2)
            .attr('width', activityLabelWidth).attr('height', activityLabelHeight).attr('rx', 6)
            .attr('fill', d.isCritical ? 'url(#criticalGradient)' : 'url(#normalGradient)')
            .attr('stroke', d.isCritical ? colors.critical : colors.secondary).attr('stroke-width', d.isCritical ? 1.5 : 1)
            .attr('filter', 'url(#shadow)');
        group.append('text').attr('x', midX).attr('y', midY - 5).attr('text-anchor', 'middle').attr('dominant-baseline', 'middle')
            .attr('fill', d.isCritical ? colors.critical : colors.primary).attr('font-weight', '600').attr('font-size', '10px')
            .attr('font-family', 'Inter, system-ui, sans-serif')
            .text(d.task.name.length > 7 ? d.task.name.substring(0, 7) + "..." : d.task.name);
        group.append('text').attr('x', midX).attr('y', midY + 8).attr('text-anchor', 'middle').attr('dominant-baseline', 'middle')
            .attr('fill', colors.textSecondary).attr('font-size', '10px').attr('font-family', 'Inter, system-ui, sans-serif')
            .text(`(${d.task.duration}j)`);
    });

    const nodeGroups = g.selectAll('.event-node-group').data(positionedEventNodes).enter()
      .append('g').attr('class', 'event-node-group').attr('transform', d => `translate(${xScale(d.x || 0)}, ${yScale(d.y || 0)})`);
    nodeGroups.append('circle').attr('r', nodeRadius)
      .attr('fill', d => d.isCritical ? 'url(#criticalGradient)' : 'url(#normalGradient)')
      .attr('stroke', d => d.isCritical ? colors.critical : colors.secondary).attr('stroke-width', d => d.isCritical ? 2.5 : 1.5)
      .attr('filter', 'url(#shadow)');
    nodeGroups.append('line').attr('x1', -nodeRadius * 0.6).attr('y1', 0).attr('x2', nodeRadius * 0.6).attr('y2', 0)
      .attr('stroke', d => d.isCritical ? colors.critical : colors.secondary).attr('stroke-width', 0.8).attr('opacity', 0.5);
    nodeGroups.append('text').attr('y', -nodeRadius * 0.35).attr('text-anchor', 'middle').attr('dominant-baseline', 'middle')
      .attr('fill', d => d.isCritical ? colors.critical : colors.primary).attr('font-weight', '600').attr('font-size', '11px')
      .text(d => d.earliestOccurrence);
    nodeGroups.append('text').attr('y', nodeRadius * 0.35).attr('text-anchor', 'middle').attr('dominant-baseline', 'middle')
      .attr('fill', colors.textSecondary).attr('font-weight', '500').attr('font-size', '10px')
      .text(d => d.latestOccurrence);
    nodeGroups.append('text').attr('y', -nodeRadius - 8).attr('text-anchor', 'middle').attr('dominant-baseline', 'alphabetic')
      .attr('fill', colors.text).attr('font-weight', '500').attr('font-size', '10px')
      .text(d => d.label);

    const legendData = [
        { label: 'Événement (EO/LO)', type: 'event-normal' }, { label: 'Événement Critique', type: 'event-critical' },
        { label: 'Activité (nom/durée)', type: 'activity-normal' }, { label: 'Activité Critique', type: 'activity-critical' },
        { label: 'Activité Fictive', type: 'activity-dummy' }
    ];
    const legend = svg.append('g').attr('transform', `translate(${margin.left}, 20)`);
    legendData.forEach((item, i) => {
        const lg = legend.append('g').attr('transform', `translate(${i * 140}, 0)`);
        if (item.type === 'event-normal') lg.append('circle').attr('cx', 10).attr('cy', 8).attr('r', 8).attr('fill', 'url(#normalGradient)').attr('stroke', colors.secondary);
        else if (item.type === 'event-critical') lg.append('circle').attr('cx', 10).attr('cy', 8).attr('r', 8).attr('fill', 'url(#criticalGradient)').attr('stroke', colors.critical);
        else if (item.type === 'activity-normal') { lg.append('line').attr('x1',0).attr('y1',8).attr('x2',20).attr('y2',8).attr('stroke',colors.textMuted).attr('stroke-width',2).attr('marker-end','url(#arrow-normal)'); lg.append('rect').attr('x',5).attr('y',0).attr('width',10).attr('height',6).attr('fill','url(#normalGradient)').attr('stroke',colors.secondary).attr('stroke-width',0.5); }
        else if (item.type === 'activity-critical') { lg.append('line').attr('x1',0).attr('y1',8).attr('x2',20).attr('y2',8).attr('stroke',colors.critical).attr('stroke-width',2.5).attr('marker-end','url(#arrow-critical)'); lg.append('rect').attr('x',5).attr('y',0).attr('width',10).attr('height',6).attr('fill','url(#criticalGradient)').attr('stroke',colors.critical).attr('stroke-width',0.5); }
        else if (item.type === 'activity-dummy') lg.append('line').attr('x1',0).attr('y1',8).attr('x2',20).attr('y2',8).attr('stroke',colors.dummyLink).attr('stroke-width',1.5).attr('stroke-dasharray','2,2').attr('marker-end','url(#arrow-dummy)');
        lg.append('text').attr('x', 25).attr('y', 12).text(item.label).attr('font-size', '10px').attr('fill', colors.text);
    });

    linkGroups.filter(d => !d.isDummy)
      .on('mouseenter', function(event, d: PertActivityLink) {
        d3.select(this).select('.link-path').attr('stroke-width', d.isCritical ? 3.5 : 3);
        const meta = d.metaData;
        tooltip.style('opacity', 1)
          .html(`
            <div style="font-family: Inter, system-ui, sans-serif; font-size: 12px; line-height: 1.6;">
              <div style="margin-bottom: 8px; border-bottom: 1px solid ${colors.border}; padding-bottom: 6px;">
                <h3 style="margin: 0 0 4px 0; font-size: 14px; color: ${colors.primary}; font-weight: 600;">${d.task.name}</h3>
                ${d.isCritical ? `<span style="background-color: ${colors.critical}; color: white; padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: 500;">Critique</span>` : ''}
              </div>
              ${meta ? `
              <table style="width: 100%; border-collapse: collapse;">
                <tbody>
                  <tr><td style="color: ${colors.textSecondary}; padding-right: 10px;">Durée:</td><td style="font-weight: 500; color: ${colors.text};">${meta.duration}j</td></tr>
                  <tr><td style="color: ${colors.textSecondary};">Début au plus tôt (ES):</td><td style="font-weight: 500; color: ${colors.text};">${meta.earliestStart}</td></tr>
                  <tr><td style="color: ${colors.textSecondary};">Fin au plus tôt (EF):</td><td style="font-weight: 500; color: ${colors.text};">${meta.earliestFinish}</td></tr>
                  <tr><td style="color: ${colors.textSecondary};">Début au plus tard (LS):</td><td style="font-weight: 500; color: ${colors.text};">${meta.latestStart}</td></tr>
                  <tr><td style="color: ${colors.textSecondary};">Fin au plus tard (LF):</td><td style="font-weight: 500; color: ${colors.text};">${meta.latestFinish}</td></tr>
                  <tr><td style="color: ${colors.textSecondary};">Marge Totale:</td><td style="font-weight: 500; color: ${colors.text};">${meta.totalSlack}j</td></tr>
                  <tr><td style="color: ${colors.textSecondary};">Marge Libre:</td><td style="font-weight: 500; color: ${colors.text};">${meta.freeSlack}j</td></tr>
                  <tr><td style="color: ${colors.textSecondary};">Prédécesseurs:</td><td style="font-weight: 500; color: ${colors.text}; max-width: 150px; word-break: break-all;">${d.task.predecessors.length > 0 ? d.task.predecessors.map(p => tasks.find(t=>t.id===p)?.name || p).join(', ') : 'Aucun'}</td></tr>
                </tbody>
              </table>` : '<p>Métadonnées non disponibles.</p>'}
            </div>
          `)
          .style('left', (event.pageX + 15) + 'px')
          .style('top', (event.pageY - 10) + 'px');
      })
      .on('mouseleave', function(event, d: PertActivityLink) {
        d3.select(this).select('.link-path').attr('stroke-width', d.isCritical ? 2.5 : 2);
        tooltip.style('opacity', 0);
      })
      .on('click', (event, d: PertActivityLink) => {
        if (onTaskClick && d.task && !d.isDummy) {
          onTaskClick(d.task, d.metaData); // Pass metadata on click
        }
      });

  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [graphData, dimensions, isLoading, onTaskClick, colors, margin]);

  return (
    <div ref={containerRef} style={{ width: '100%', height: '100%', position: 'relative', background: colors.background, overflow: 'hidden' }}>
      {isLoading && (
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', color: colors.textMuted, fontFamily: 'Inter, system-ui, sans-serif' }}>
          Chargement du diagramme...
        </div>
      )}
      <svg ref={svgRef}></svg>
      <div
        ref={tooltipRef}
        style={{
          position: 'absolute', opacity: 0, pointerEvents: 'none',
          backgroundColor: colors.surface, color: colors.text,
          border: `1px solid ${colors.border}`, borderRadius: '8px',
          padding: '12px', boxShadow: '0 6px 12px rgba(0,0,0,0.15)',
          minWidth: '250px', maxWidth: '350px', // Adjusted width for more data
          transition: 'opacity 0.2s ease-in-out', 
        }}
      ></div>
    </div>
  );
}