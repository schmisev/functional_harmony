
(function(l, i, v, e) { v = l.createElement(i); v.async = 1; v.src = '//' + (location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; e = l.getElementsByTagName(i)[0]; e.parentNode.insertBefore(v, e)})(document, 'script');
var app = (function () {
    'use strict';

    function noop() { }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }

    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function destroy_each(iterations, detaching) {
        for (let i = 0; i < iterations.length; i += 1) {
            if (iterations[i])
                iterations[i].d(detaching);
        }
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_data(text, data) {
        data = '' + data;
        if (text.data !== data)
            text.data = data;
    }
    function select_option(select, value) {
        for (let i = 0; i < select.options.length; i += 1) {
            const option = select.options[i];
            if (option.__value === value) {
                option.selected = true;
                return;
            }
        }
    }
    function select_value(select) {
        const selected_option = select.querySelector(':checked') || select.options[0];
        return selected_option && selected_option.__value;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    function flush() {
        const seen_callbacks = new Set();
        do {
            // first, call beforeUpdate functions
            // and update components
            while (dirty_components.length) {
                const component = dirty_components.shift();
                set_current_component(component);
                update(component.$$);
            }
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    callback();
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
    }
    function update($$) {
        if ($$.fragment) {
            $$.update($$.dirty);
            run_all($$.before_update);
            $$.fragment.p($$.dirty, $$.ctx);
            $$.dirty = null;
            $$.after_update.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function mount_component(component, target, anchor) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment.m(target, anchor);
        // onMount happens before the initial afterUpdate
        add_render_callback(() => {
            const new_on_destroy = on_mount.map(run).filter(is_function);
            if (on_destroy) {
                on_destroy.push(...new_on_destroy);
            }
            else {
                // Edge case - component was destroyed immediately,
                // most likely as a result of a binding initialising
                run_all(new_on_destroy);
            }
            component.$$.on_mount = [];
        });
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        if (component.$$.fragment) {
            run_all(component.$$.on_destroy);
            component.$$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            component.$$.on_destroy = component.$$.fragment = null;
            component.$$.ctx = {};
        }
    }
    function make_dirty(component, key) {
        if (!component.$$.dirty) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty = blank_object();
        }
        component.$$.dirty[key] = true;
    }
    function init(component, options, instance, create_fragment, not_equal, prop_names) {
        const parent_component = current_component;
        set_current_component(component);
        const props = options.props || {};
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props: prop_names,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            before_update: [],
            after_update: [],
            context: new Map(parent_component ? parent_component.$$.context : []),
            // everything else
            callbacks: blank_object(),
            dirty: null
        };
        let ready = false;
        $$.ctx = instance
            ? instance(component, props, (key, value) => {
                if ($$.ctx && not_equal($$.ctx[key], $$.ctx[key] = value)) {
                    if ($$.bound[key])
                        $$.bound[key](value);
                    if (ready)
                        make_dirty(component, key);
                }
            })
            : props;
        $$.update();
        ready = true;
        run_all($$.before_update);
        $$.fragment = create_fragment($$.ctx);
        if (options.target) {
            if (options.hydrate) {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment.l(children(options.target));
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor);
            flush();
        }
        set_current_component(parent_component);
    }
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set() {
            // overridden by instance, if it has props
        }
    }
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error(`'target' is a required option`);
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn(`Component was already destroyed`); // eslint-disable-line no-console
            };
        }
    }

    const WHOLE_NOTES = ['C', 'D', 'E', 'F', 'G', 'A', 'B',];
    const ROMAN_NOTES = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII'];
    const ROMAN_SECONDARY = [
        [false, ''],
        [true, ''],
        [true, ''],
        [false, ''],
        [false, ''],
        [true, ''],
        [true, '°'],
    ];
    const MODS = ['', '#', 'x', '(3#)', '(4#)', '(3#)', '(4#)', '(5#|5b)', '(4b)', '(3b)', 'bb', 'b',];
    const CHORDS = [
        ['maj7', '6'],
        ['m7', 'm6'],
        ['m7'],
        ['maj7', '6'], 
        ['7', '6'],
        ['m7'],
        ['dim7'],
    ];

    const WHOLE_NOTE_TO_REAL_INDICES = [0, 2, 4, 5, 7, 9, 11];

    const OCTAVE = 7;
    const REAL_OCTAVE = 12;

    const HEPTATONIC_SCALE = [2, 2, 1, 2, 2, 2, 1];
    const HEPTATONIC_MODES = [
        ["Ionian", "major"],
        ["Dorian"],
        ["Phrygian"],
        ["Lydian"],
        ["Mixolydian"],
        ["Aeolian", "minor"],
        ["Locrian"],
    ];

    const WHOLE_NOTE_SELECT = WHOLE_NOTES.map((n, i) => [n, i]);
    const MOD_SELECT = [
        ['x', 2],
        ['#', 1],
        ['~', 0],
        ['b', -1],
        ['bb', -2],
    ];

    const modulo = (x, y) => ((x%y)+y)%y;

    const heptaToDodeca = function(wni, mi) {
        return modulo(WHOLE_NOTE_TO_REAL_INDICES[modulo(wni, OCTAVE)] + mi, REAL_OCTAVE);
    };

    const generateChordScale = function(mode, wni, mi) {
        var scale = [];
        var acc = 0; // half step accumulator
        var si = 0; // scale index

        for (var i = 0; i < OCTAVE; i++) {
            si = modulo(i + mode, OCTAVE); // scale index
            
            // Building the chord
            var chord = {};

            // index section
            chord.wni = modulo(wni + i, OCTAVE); // whole note index [0, 7]
            chord.rni = heptaToDodeca(wni, acc + mi); // real note index [0, 11]
            chord.rwni = heptaToDodeca(chord.wni, 0); // real whole note index [0, 11]
            chord.mi = modulo(chord.rni - chord.rwni, REAL_OCTAVE); // mod index [0, 11]

            // name section
            chord.wholeNote = WHOLE_NOTES[chord.wni]; // whole note name
            chord.mod = MODS[chord.mi]; // mod name
            chord.possibleChords = CHORDS[si]; // list of possible chords
            chord.bareRoman = ROMAN_NOTES[i]; // roman symbol
            chord.secRoman = (ROMAN_SECONDARY[si][0] ? chord.bareRoman.toLowerCase() : chord.bareRoman).concat(ROMAN_SECONDARY[si][1]);

            scale.push(chord);

            // Updating the accumulator
            acc += HEPTATONIC_SCALE[si];
        }

        return scale;
    };

    const generateModeMatrix = function(wni, mi) {
        var modes = [];

        for (var i = 0; i < OCTAVE; i++) {
            var mode = {};

            // index section
            mode.i = i;

            // name section
            mode.name = HEPTATONIC_MODES[i];
            mode.chordScale = generateChordScale(i, wni, mi);

            modes.push(mode);
        }

        return modes;
    };

    var cl = /*#__PURE__*/Object.freeze({
        ROMAN_NOTES: ROMAN_NOTES,
        WHOLE_NOTE_SELECT: WHOLE_NOTE_SELECT,
        MOD_SELECT: MOD_SELECT,
        generateChordScale: generateChordScale,
        generateModeMatrix: generateModeMatrix
    });

    /* src\App.svelte generated by Svelte v3.6.5 */

    const file = "src\\App.svelte";

    function get_each_context_1(ctx, list, i) {
    	const child_ctx = Object.create(ctx);
    	child_ctx.chord = list[i];
    	return child_ctx;
    }

    function get_each_context(ctx, list, i) {
    	const child_ctx = Object.create(ctx);
    	child_ctx.mode = list[i];
    	return child_ctx;
    }

    function get_each_context_2(ctx, list, i) {
    	const child_ctx = Object.create(ctx);
    	child_ctx.rn = list[i];
    	return child_ctx;
    }

    function get_each_context_3(ctx, list, i) {
    	const child_ctx = Object.create(ctx);
    	child_ctx.n = list[i][0];
    	child_ctx.v = list[i][1];
    	return child_ctx;
    }

    function get_each_context_4(ctx, list, i) {
    	const child_ctx = Object.create(ctx);
    	child_ctx.n = list[i][0];
    	child_ctx.v = list[i][1];
    	return child_ctx;
    }

    // (21:0) {#each cl.WHOLE_NOTE_SELECT as [n, v]}
    function create_each_block_4(ctx) {
    	var option, t_value = ctx.n, t, option_value_value;

    	return {
    		c: function create() {
    			option = element("option");
    			t = text(t_value);
    			option.__value = option_value_value = ctx.v;
    			option.value = option.__value;
    			add_location(option, file, 21, 1, 442);
    		},

    		m: function mount(target, anchor) {
    			insert(target, option, anchor);
    			append(option, t);
    		},

    		p: function update(changed, ctx) {
    			option.value = option.__value;
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(option);
    			}
    		}
    	};
    }

    // (28:0) {#each cl.MOD_SELECT as [n, v]}
    function create_each_block_3(ctx) {
    	var option, t_value = ctx.n, t, option_value_value;

    	return {
    		c: function create() {
    			option = element("option");
    			t = text(t_value);
    			option.__value = option_value_value = ctx.v;
    			option.value = option.__value;
    			add_location(option, file, 28, 1, 579);
    		},

    		m: function mount(target, anchor) {
    			insert(target, option, anchor);
    			append(option, t);
    		},

    		p: function update(changed, ctx) {
    			option.value = option.__value;
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(option);
    			}
    		}
    	};
    }

    // (35:0) {#if showHeader}
    function create_if_block_2(ctx) {
    	var tr, t;

    	var if_block = (ctx.showModeNames) && create_if_block_3();

    	var each_value_2 = ROMAN_NOTES;

    	var each_blocks = [];

    	for (var i = 0; i < each_value_2.length; i += 1) {
    		each_blocks[i] = create_each_block_2(get_each_context_2(ctx, each_value_2, i));
    	}

    	return {
    		c: function create() {
    			tr = element("tr");
    			if (if_block) if_block.c();
    			t = space();

    			for (var i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}
    			add_location(tr, file, 35, 0, 688);
    		},

    		m: function mount(target, anchor) {
    			insert(target, tr, anchor);
    			if (if_block) if_block.m(tr, null);
    			append(tr, t);

    			for (var i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(tr, null);
    			}
    		},

    		p: function update(changed, ctx) {
    			if (ctx.showModeNames) {
    				if (!if_block) {
    					if_block = create_if_block_3();
    					if_block.c();
    					if_block.m(tr, t);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}

    			if (changed.cl) {
    				each_value_2 = ROMAN_NOTES;

    				for (var i = 0; i < each_value_2.length; i += 1) {
    					const child_ctx = get_each_context_2(ctx, each_value_2, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(changed, child_ctx);
    					} else {
    						each_blocks[i] = create_each_block_2(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(tr, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}
    				each_blocks.length = each_value_2.length;
    			}
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(tr);
    			}

    			if (if_block) if_block.d();

    			destroy_each(each_blocks, detaching);
    		}
    	};
    }

    // (37:0) {#if showModeNames}
    function create_if_block_3(ctx) {
    	var th;

    	return {
    		c: function create() {
    			th = element("th");
    			th.textContent = "MODES";
    			attr(th, "class", "svelte-wmqv9l");
    			add_location(th, file, 37, 1, 714);
    		},

    		m: function mount(target, anchor) {
    			insert(target, th, anchor);
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(th);
    			}
    		}
    	};
    }

    // (41:0) {#each cl.ROMAN_NOTES as rn}
    function create_each_block_2(ctx) {
    	var th, t_value = ctx.rn, t;

    	return {
    		c: function create() {
    			th = element("th");
    			t = text(t_value);
    			attr(th, "class", "svelte-wmqv9l");
    			add_location(th, file, 41, 1, 766);
    		},

    		m: function mount(target, anchor) {
    			insert(target, th, anchor);
    			append(th, t);
    		},

    		p: noop,

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(th);
    			}
    		}
    	};
    }

    // (49:1) {#if showModeNames}
    function create_if_block_1(ctx) {
    	var td, b, t_value = ctx.mode.name[0], t;

    	return {
    		c: function create() {
    			td = element("td");
    			b = element("b");
    			t = text(t_value);
    			add_location(b, file, 49, 18, 873);
    			attr(td, "class", "mode svelte-wmqv9l");
    			add_location(td, file, 49, 1, 856);
    		},

    		m: function mount(target, anchor) {
    			insert(target, td, anchor);
    			append(td, b);
    			append(b, t);
    		},

    		p: function update(changed, ctx) {
    			if ((changed.modeMatrix) && t_value !== (t_value = ctx.mode.name[0])) {
    				set_data(t, t_value);
    			}
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(td);
    			}
    		}
    	};
    }

    // (61:4) {#if showRoman}
    function create_if_block(ctx) {
    	var td, span, b, t_value = ctx.chord.secRoman, t;

    	return {
    		c: function create() {
    			td = element("td");
    			span = element("span");
    			b = element("b");
    			t = text(t_value);
    			add_location(b, file, 62, 25, 1227);
    			attr(span, "class", "roman");
    			add_location(span, file, 62, 5, 1207);
    			attr(td, "class", "roman svelte-wmqv9l");
    			add_location(td, file, 61, 4, 1183);
    		},

    		m: function mount(target, anchor) {
    			insert(target, td, anchor);
    			append(td, span);
    			append(span, b);
    			append(b, t);
    		},

    		p: function update(changed, ctx) {
    			if ((changed.modeMatrix) && t_value !== (t_value = ctx.chord.secRoman)) {
    				set_data(t, t_value);
    			}
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(td);
    			}
    		}
    	};
    }

    // (52:1) {#each mode.chordScale as chord}
    function create_each_block_1(ctx) {
    	var td1, table, tr0, td0, span0, b, t0_value = ctx.chord.wholeNote, t0, sup, t1_value = ctx.chord.mod, t1, span1, t2_value = ctx.chord.possibleChords[0], t2, t3, tr1;

    	var if_block = (ctx.showRoman) && create_if_block(ctx);

    	return {
    		c: function create() {
    			td1 = element("td");
    			table = element("table");
    			tr0 = element("tr");
    			td0 = element("td");
    			span0 = element("span");
    			b = element("b");
    			t0 = text(t0_value);
    			sup = element("sup");
    			t1 = text(t1_value);
    			span1 = element("span");
    			t2 = text(t2_value);
    			t3 = space();
    			tr1 = element("tr");
    			if (if_block) if_block.c();
    			add_location(sup, file, 56, 44, 1046);
    			add_location(b, file, 56, 24, 1026);
    			attr(span0, "class", "note");
    			add_location(span0, file, 56, 5, 1007);
    			attr(span1, "class", "chord");
    			add_location(span1, file, 56, 77, 1079);
    			attr(td0, "class", "chord svelte-wmqv9l");
    			add_location(td0, file, 55, 4, 983);
    			add_location(tr0, file, 54, 3, 974);
    			add_location(tr1, file, 59, 3, 1154);
    			attr(table, "class", "chord svelte-wmqv9l");
    			add_location(table, file, 53, 2, 949);
    			attr(td1, "class", "svelte-wmqv9l");
    			add_location(td1, file, 52, 1, 942);
    		},

    		m: function mount(target, anchor) {
    			insert(target, td1, anchor);
    			append(td1, table);
    			append(table, tr0);
    			append(tr0, td0);
    			append(td0, span0);
    			append(span0, b);
    			append(b, t0);
    			append(b, sup);
    			append(sup, t1);
    			append(td0, span1);
    			append(span1, t2);
    			append(table, t3);
    			append(table, tr1);
    			if (if_block) if_block.m(tr1, null);
    		},

    		p: function update(changed, ctx) {
    			if ((changed.modeMatrix) && t0_value !== (t0_value = ctx.chord.wholeNote)) {
    				set_data(t0, t0_value);
    			}

    			if ((changed.modeMatrix) && t1_value !== (t1_value = ctx.chord.mod)) {
    				set_data(t1, t1_value);
    			}

    			if ((changed.modeMatrix) && t2_value !== (t2_value = ctx.chord.possibleChords[0])) {
    				set_data(t2, t2_value);
    			}

    			if (ctx.showRoman) {
    				if (if_block) {
    					if_block.p(changed, ctx);
    				} else {
    					if_block = create_if_block(ctx);
    					if_block.c();
    					if_block.m(tr1, null);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(td1);
    			}

    			if (if_block) if_block.d();
    		}
    	};
    }

    // (47:0) {#each modeMatrix as mode}
    function create_each_block(ctx) {
    	var tr, t0, t1;

    	var if_block = (ctx.showModeNames) && create_if_block_1(ctx);

    	var each_value_1 = ctx.mode.chordScale;

    	var each_blocks = [];

    	for (var i = 0; i < each_value_1.length; i += 1) {
    		each_blocks[i] = create_each_block_1(get_each_context_1(ctx, each_value_1, i));
    	}

    	return {
    		c: function create() {
    			tr = element("tr");
    			if (if_block) if_block.c();
    			t0 = space();

    			for (var i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t1 = space();
    			add_location(tr, file, 47, 1, 829);
    		},

    		m: function mount(target, anchor) {
    			insert(target, tr, anchor);
    			if (if_block) if_block.m(tr, null);
    			append(tr, t0);

    			for (var i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(tr, null);
    			}

    			append(tr, t1);
    		},

    		p: function update(changed, ctx) {
    			if (ctx.showModeNames) {
    				if (if_block) {
    					if_block.p(changed, ctx);
    				} else {
    					if_block = create_if_block_1(ctx);
    					if_block.c();
    					if_block.m(tr, t0);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}

    			if (changed.showRoman || changed.modeMatrix) {
    				each_value_1 = ctx.mode.chordScale;

    				for (var i = 0; i < each_value_1.length; i += 1) {
    					const child_ctx = get_each_context_1(ctx, each_value_1, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(changed, child_ctx);
    					} else {
    						each_blocks[i] = create_each_block_1(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(tr, t1);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}
    				each_blocks.length = each_value_1.length;
    			}
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(tr);
    			}

    			if (if_block) if_block.d();

    			destroy_each(each_blocks, detaching);
    		}
    	};
    }

    function create_fragment(ctx) {
    	var h1, t1, div, select0, t2, select1, t3, table, t4, t5, p, span0, input0, t6, t7, span1, input1, t8, t9, span2, input2, t10, dispose;

    	var each_value_4 = WHOLE_NOTE_SELECT;

    	var each_blocks_2 = [];

    	for (var i = 0; i < each_value_4.length; i += 1) {
    		each_blocks_2[i] = create_each_block_4(get_each_context_4(ctx, each_value_4, i));
    	}

    	var each_value_3 = MOD_SELECT;

    	var each_blocks_1 = [];

    	for (var i = 0; i < each_value_3.length; i += 1) {
    		each_blocks_1[i] = create_each_block_3(get_each_context_3(ctx, each_value_3, i));
    	}

    	var if_block = (ctx.showHeader) && create_if_block_2(ctx);

    	var each_value = ctx.modeMatrix;

    	var each_blocks = [];

    	for (var i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	return {
    		c: function create() {
    			h1 = element("h1");
    			h1.textContent = "~ modes ~";
    			t1 = space();
    			div = element("div");
    			select0 = element("select");

    			for (var i = 0; i < each_blocks_2.length; i += 1) {
    				each_blocks_2[i].c();
    			}

    			t2 = space();
    			select1 = element("select");

    			for (var i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].c();
    			}

    			t3 = space();
    			table = element("table");
    			if (if_block) if_block.c();
    			t4 = space();

    			for (var i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t5 = space();
    			p = element("p");
    			span0 = element("span");
    			input0 = element("input");
    			t6 = text(" show mode names");
    			t7 = space();
    			span1 = element("span");
    			input1 = element("input");
    			t8 = text(" show header");
    			t9 = space();
    			span2 = element("span");
    			input2 = element("input");
    			t10 = text(" show numerals");
    			attr(h1, "class", "svelte-wmqv9l");
    			add_location(h1, file, 15, 0, 305);
    			if (ctx.wniSelect === void 0) add_render_callback(() => ctx.select0_change_handler.call(select0));
    			attr(select0, "class", "svelte-wmqv9l");
    			add_location(select0, file, 19, 0, 370);
    			if (ctx.miSelect === void 0) add_render_callback(() => ctx.select1_change_handler.call(select1));
    			attr(select1, "class", "svelte-wmqv9l");
    			add_location(select1, file, 26, 0, 515);
    			attr(table, "class", "modes svelte-wmqv9l");
    			add_location(table, file, 33, 0, 649);
    			attr(input0, "type", "checkbox");
    			add_location(input0, file, 75, 20, 1383);
    			attr(span0, "class", "check svelte-wmqv9l");
    			add_location(span0, file, 75, 0, 1363);
    			attr(input1, "type", "checkbox");
    			add_location(input1, file, 76, 20, 1477);
    			attr(span1, "class", "check svelte-wmqv9l");
    			add_location(span1, file, 76, 0, 1457);
    			attr(input2, "type", "checkbox");
    			add_location(input2, file, 77, 20, 1564);
    			attr(span2, "class", "check svelte-wmqv9l");
    			add_location(span2, file, 77, 0, 1544);
    			add_location(p, file, 74, 0, 1359);
    			attr(div, "class", "global svelte-wmqv9l");
    			add_location(div, file, 17, 0, 325);

    			dispose = [
    				listen(select0, "change", ctx.select0_change_handler),
    				listen(select1, "change", ctx.select1_change_handler),
    				listen(input0, "change", ctx.input0_change_handler),
    				listen(input1, "change", ctx.input1_change_handler),
    				listen(input2, "change", ctx.input2_change_handler)
    			];
    		},

    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			insert(target, h1, anchor);
    			insert(target, t1, anchor);
    			insert(target, div, anchor);
    			append(div, select0);

    			for (var i = 0; i < each_blocks_2.length; i += 1) {
    				each_blocks_2[i].m(select0, null);
    			}

    			select_option(select0, ctx.wniSelect);

    			append(div, t2);
    			append(div, select1);

    			for (var i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].m(select1, null);
    			}

    			select_option(select1, ctx.miSelect);

    			append(div, t3);
    			append(div, table);
    			if (if_block) if_block.m(table, null);
    			append(table, t4);

    			for (var i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(table, null);
    			}

    			append(div, t5);
    			append(div, p);
    			append(p, span0);
    			append(span0, input0);

    			input0.checked = ctx.showModeNames;

    			append(span0, t6);
    			append(p, t7);
    			append(p, span1);
    			append(span1, input1);

    			input1.checked = ctx.showHeader;

    			append(span1, t8);
    			append(p, t9);
    			append(p, span2);
    			append(span2, input2);

    			input2.checked = ctx.showRoman;

    			append(span2, t10);
    		},

    		p: function update(changed, ctx) {
    			if (changed.cl) {
    				each_value_4 = WHOLE_NOTE_SELECT;

    				for (var i = 0; i < each_value_4.length; i += 1) {
    					const child_ctx = get_each_context_4(ctx, each_value_4, i);

    					if (each_blocks_2[i]) {
    						each_blocks_2[i].p(changed, child_ctx);
    					} else {
    						each_blocks_2[i] = create_each_block_4(child_ctx);
    						each_blocks_2[i].c();
    						each_blocks_2[i].m(select0, null);
    					}
    				}

    				for (; i < each_blocks_2.length; i += 1) {
    					each_blocks_2[i].d(1);
    				}
    				each_blocks_2.length = each_value_4.length;
    			}

    			if (changed.wniSelect) select_option(select0, ctx.wniSelect);

    			if (changed.cl) {
    				each_value_3 = MOD_SELECT;

    				for (var i = 0; i < each_value_3.length; i += 1) {
    					const child_ctx = get_each_context_3(ctx, each_value_3, i);

    					if (each_blocks_1[i]) {
    						each_blocks_1[i].p(changed, child_ctx);
    					} else {
    						each_blocks_1[i] = create_each_block_3(child_ctx);
    						each_blocks_1[i].c();
    						each_blocks_1[i].m(select1, null);
    					}
    				}

    				for (; i < each_blocks_1.length; i += 1) {
    					each_blocks_1[i].d(1);
    				}
    				each_blocks_1.length = each_value_3.length;
    			}

    			if (changed.miSelect) select_option(select1, ctx.miSelect);

    			if (ctx.showHeader) {
    				if (if_block) {
    					if_block.p(changed, ctx);
    				} else {
    					if_block = create_if_block_2(ctx);
    					if_block.c();
    					if_block.m(table, t4);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}

    			if (changed.modeMatrix || changed.showRoman || changed.showModeNames) {
    				each_value = ctx.modeMatrix;

    				for (var i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(changed, child_ctx);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(table, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}
    				each_blocks.length = each_value.length;
    			}

    			if (changed.showModeNames) input0.checked = ctx.showModeNames;
    			if (changed.showHeader) input1.checked = ctx.showHeader;
    			if (changed.showRoman) input2.checked = ctx.showRoman;
    		},

    		i: noop,
    		o: noop,

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(h1);
    				detach(t1);
    				detach(div);
    			}

    			destroy_each(each_blocks_2, detaching);

    			destroy_each(each_blocks_1, detaching);

    			if (if_block) if_block.d();

    			destroy_each(each_blocks, detaching);

    			run_all(dispose);
    		}
    	};
    }

    function instance($$self, $$props, $$invalidate) {
    	let wniSelect = 0;
    	let miSelect = 0;

    	let showModeNames = true;
    	let showHeader = true;
    	let showRoman = true;

    	let modeMatrix = generateModeMatrix(0, 0);

    	function select0_change_handler() {
    		wniSelect = select_value(this);
    		$$invalidate('wniSelect', wniSelect);
    		$$invalidate('cl', cl);
    	}

    	function select1_change_handler() {
    		miSelect = select_value(this);
    		$$invalidate('miSelect', miSelect);
    		$$invalidate('cl', cl);
    	}

    	function input0_change_handler() {
    		showModeNames = this.checked;
    		$$invalidate('showModeNames', showModeNames);
    	}

    	function input1_change_handler() {
    		showHeader = this.checked;
    		$$invalidate('showHeader', showHeader);
    	}

    	function input2_change_handler() {
    		showRoman = this.checked;
    		$$invalidate('showRoman', showRoman);
    	}

    	$$self.$$.update = ($$dirty = { wniSelect: 1, miSelect: 1 }) => {
    		if ($$dirty.wniSelect || $$dirty.miSelect) { $$invalidate('modeMatrix', modeMatrix = generateModeMatrix(parseInt(wniSelect), parseInt(miSelect))); }
    	};

    	return {
    		wniSelect,
    		miSelect,
    		showModeNames,
    		showHeader,
    		showRoman,
    		modeMatrix,
    		select0_change_handler,
    		select1_change_handler,
    		input0_change_handler,
    		input1_change_handler,
    		input2_change_handler
    	};
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, []);
    	}
    }

    const app = new App({
    	target: document.body,
    	props: {
    	}
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map
