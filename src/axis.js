import * as d3 from 'd3';
import { stylable, appendId, identity } from './mixin.js';


function tickvals(vs, step, start, g) {
    if (typeof vs !== 'undefined') return vs;

    var values = vs;

    if (typeof step === 'number') {
        let domain = g.measure().domain();
        const range = g.measure().range();
        domain.sort((a, b) => a - b);
        values = [];
        for (var v = start ?? Math.ceil(domain[0]/step)*step; v <= domain[1]; v += step)
            values.push(v);
        if (
            g.kind() == 'circular'
            && ((range[0] - range[1]) % 360 == 0)
            && values.includes(domain[0])
            && values.includes(domain[1])
        ) values.pop();
    } else {
        values = g.measure().ticks();
    }
    return values;
}


export function axisLine() {
    function line(sel, g) {
        let _ = sel
            .append('path')
            .attr('d', g.sectorpath(...g.measure().domain()));
        line.stylable(_);
    }
    return stylable(line).class('g3-axis-line');
}


export function axisSector(vs) {
    var values = vs.slice(),
        size = 5,
        inset = 0;
    function sector(sel, g) {
        let _ = sel
            .append('path')
            .attr('d', g.sectorpath(...values, size, inset));
        sector.stylable(_);
    }
    sector.size = function(_) {
        return arguments.length ? (size = _, sector) : size;
    }
    sector.inset = function(_) {
        return arguments.length ? (inset = _, sector) : inset;
    }
    return stylable(sector).class('g3-axis-sector');
}


export function axisTicks(vs) {
    var shape = 'tick',
        size = 10,
        width = 1,
        inset = 0,
        values = vs && vs.slice(),
        step, start;
    function ticks(sel, g) {
        let vs = tickvals(values, step, start, g);
        let _ = sel.append('g');
        ticks.class('g3-axis-ticks-' + shape).stylable(_);
        _ = _.selectAll(null)
            .data(vs)
          .enter().append('g')
            .attr('transform', d => g.marktransform(d, inset));

        switch(shape) {
            case 'dot':
                _.append('circle').attr('r', size);
                break;
            case 'wedge':
                _.append('path').attr('d', `M 0,${size} L ${width/2},0 L ${-width/2},0 z`)
                break;
            case 'rect':
                _.append('rect').attr('width', width).attr('height', size).attr('x', -width/2);
                break;
            default:
                _.append('path').attr('d', d3.line()([[0, 0], [0, size]]));
        }
    }
    ticks.step = function(_) {
        return arguments.length ? (step = _, ticks) : step;
    }
    ticks.start = function(_) {
        return arguments.length ? (start = _, ticks) : start;
    }
    ticks.shape = function(_) {
        return arguments.length ? (shape = _, ticks) : shape;
    }
    ticks.size = function(_) {
        return arguments.length ? (size = _, ticks) : size;
    }
    ticks.width = function(_) {
        return arguments.length ? (width = _, ticks) : width;
    }
    ticks.inset = function(_) {
        return arguments.length ? (inset = _, ticks) : inset;
    }
    return stylable(ticks).class('g3-axis-ticks');
}


export function axisLabels(vs) {
    const isMap = typeof vs === 'object' && !Array.isArray(vs);

    /*
    orientation:
    - fixed: normal reading orientation independent of axis position
    - relative: relative to axis orientation at label position, with normal reading orientation when axis is rotated to top
    - cw / ccw: text is drawn along the axis path in either clockwise or counter-clockwise direction

    - rotate: rotation to apply w.r.t. fixed or relative orientation
    - upright: choose between rotate and rotate+180 direction based on whichever is pointing up
    */
    var orient = 'fixed',  // 'relative', 'cw', 'ccw'
        upright = true,  //TODO
        size = 20,
        inset = 25,
        rotate = 0,
        values = isMap ? Object.keys(vs) : vs,
        format = isMap ? v => vs[v] : identity,
        step, start;
    function labels(sel, g) {
        const vs = tickvals(values, step, start, g),
            circPath = orient.endsWith('cw'),
            pathId = circPath ? appendId('axis-label-path-') : undefined;

        let _ = sel.append('g');
        labels.stylable(_);
        _ = _.selectAll(null)
            .data(vs)
          .enter().append('g');
        if (circPath) {
            const r = g.r() - inset,
                cw = orient == 'cw' ? 1: 0;
            _.append('path')
                .attr('id', (d, i) => `${pathId}-${i}`)
                .attr('d', `M 0,${r} A ${r},${r},0,1,${cw},0,-${r} A ${r},${r},0,1,${cw},0,${r}`)
                .attr('style', 'visibility: hidden')
                .attr('transform', d => g.metrictransform(d));
        }
        _ = _.append('text')
            .attr('font-size', size);
        if (circPath) {
            _ = _.append('textPath')
                .attr('startOffset', '50%')
                .attr('href', (d, i) => `#${pathId}-${i}`);
        } else {
//TODO upright text style
            _.attr('transform', d => {
                let xform = g.marktransform(d, inset);
                if (orient == 'fixed' && g.kind() == 'circular') xform += ' ' + g.metrictransform(d, true);
                if (rotate) xform += ` rotate(${rotate})`
                return `${xform}`;
            })
        }
        _.text(format);
    }
    labels.step = function(_) {
        return arguments.length ? (step = _, labels) : step;
    }
    labels.start = function(_) {
        return arguments.length ? (start = _, labels) : start;
    }
    labels.orient = function(_) {
        return arguments.length ? (orient = _, labels) : orient;
    }
    labels.upright = function(_) {
        return arguments.length ? (upright = _, labels) : upright;
    }
    labels.size = function(_) {
        return arguments.length ? (size = _, labels) : size;
    }
    labels.inset = function(_) {
        return arguments.length ? (inset = _, labels) : inset;
    }
    labels.rotate = function(_) {
        return arguments.length ? (rotate = _, labels) : rotate;
    }
    labels.format = function(_) {
        return arguments.length ? (format = _, labels) : format;
    }
    return stylable(labels).class('g3-axis-labels');
}
