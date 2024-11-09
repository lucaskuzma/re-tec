import './App.css';
import { Component } from 'react';
import NeuronComponent from './NeuronComponent';
import * as Tone from 'tone';
import { GraphData } from 'react-force-graph-3d';
import React from 'react';
import GraphComponent from './GraphComponent.tsx';

type Signal = {
    progress: number;
    note: string;
    noteIndex: number;
    rowIndex: number;
    key: number;
};

type Connection = {
    destination: string;
    length: number;
    signals: Array<Signal>;
};

type Neuron = {
    name: string;
    threshold: number;
    activation: number;
    stimulation?: number;
    firing: boolean;
    lastFired?: number;
    connections: Array<Connection>;
};

type ToneRow = {
    notes: Array<string>;
};

type OutputNeuron = Neuron & {
    rows: Array<ToneRow>;
    currentNote: number;
    currentRow: number;
};

type State = {
    stimulus: string;
    status: string;
    time: number;
    rows: number;
    value: string;
    output: string;
    neurons: Map<string, Neuron>;
    graph: GraphData;
};

class App extends Component {
    timer: NodeJS.Timer;
    state: State = {
        stimulus: '',
        status: '',
        time: 0,
        rows: 0,
        value: '',
        output: '',
        neurons: new Map<string, Neuron>(),
        graph: { nodes: [], links: [] },
    };
    synth: Tone.PolySynth;

    constructor(props) {
        super(props);
        this.synth = new Tone.PolySynth().toDestination();
        this.synth.set({
            oscillator: {
                type: 'sine',
            },
            envelope: {
                decay: 1,
                release: 2,
            },
        });

        let value = [
            'c4 4 12 › g4 2 x 8',
            'g4 3 › c4 6 g5 2',
            'x 2 › c4 2',
            'g5 3 › y 3',
            'y 2 24 › c4 2 z 1',
            'z 2 › g3 1 c5 3',
            'g3 1 › y 2',
            'c5 2 › y 8 f4 3',
            'f4 2 › c4 18',
        ].join('\n');

        this.state = {
            ...App.parseInput(value),
            stimulus: '. . . y . .',
            status: 'ok',
            time: 0,
        };

        this.handleChange = this.handleChange.bind(this);
        this.handleStimulusChange = this.handleStimulusChange.bind(this);
        this.tick = this.tick.bind(this);
    }

    componentDidMount() {
        this.timer = setInterval(this.tick, 1000 / 8);
    }

    componentWillUnmount() {
        clearInterval(this.timer);
    }

    tick() {
        this.setState({ time: this.state.time + 1 });
        this.setState({ status: this.state.time % 8 });

        const stimuli = this.state.stimulus.split(' ');
        let sensor = this.state.neurons.get(
            stimuli[this.state.time % stimuli.length]
        );
        if (sensor) sensor.activation++;

        this.state.neurons.forEach((neuron) => {
            if (neuron.activation >= neuron.threshold) {
                // if threshold reached, fire
                neuron.firing = true;
                neuron.activation = 0;
                neuron.lastFired = Date.now();
                neuron.connections.forEach((connection) => {
                    // add signal to connection
                    connection.signals.push({
                        progress: 0,
                        key: Math.random(),
                    });
                });
                const regex = /\d+$/;
                if (regex.test(neuron.name)) {
                    const note = neuron.name;
                    this.synth.triggerAttackRelease(note, '2', undefined, 0.1);
                }
            } else {
                // otherwise stop firing
                neuron.firing = false;
            }

            if (neuron.stimulation && neuron.stimulation > 0) {
                neuron.activation += 1 / neuron.stimulation;
            }

            neuron.connections.forEach((connection) => {
                connection.signals.forEach((signal) => {
                    signal.progress++;
                    if (signal.progress > connection.length) {
                        // activate destination
                        let destination = this.state.neurons.get(
                            connection.destination
                        );
                        if (destination) destination.activation++;
                        // flag for deletion
                        signal.progress = -1;
                    }
                });
                connection.signals = connection.signals.filter(
                    (signal) => signal.progress >= 0
                );
            });
        });
    }

    handleChange(event) {
        this.setState(App.parseInput(event.target.value));
        Tone.start();
    }

    handleStimulusChange(event) {
        this.setState({
            stimulus: event.target.value,
        });
        Tone.start();
    }

    static createNeuron(
        name: string,
        threshold: string,
        stimulation?: string
    ): Neuron {
        return {
            name: name,
            threshold: parseInt(threshold),
            activation: 0,
            stimulation: stimulation ? parseInt(stimulation) : undefined,
            firing: false,
            connections: [],
        };
    }

    static parseConnections(connectionString: string): Connection[] {
        const connections: Connection[] = [];
        let connectionTokens = connectionString.trim().split(' ');
        while (connectionTokens.length > 1) {
            let destination = connectionTokens.shift();
            let length = connectionTokens.shift();
            const connection = {
                destination: destination!,
                length: length ? parseInt(length) : 0,
                signals: [],
            } as Connection;
            connections.push(connection);
        }
        return connections;
    }

    static parseToneRows(toneString: string): ToneRow[] {
        const rows: ToneRow[] = [];
        const rowMatches = toneString.match(/\[(.*?)\]/g) || [];

        for (const match of rowMatches) {
            // Remove brackets and split by spaces
            const notes = match.slice(1, -1).split(' ');
            rows.push({ notes });
        }

        return rows;
    }

    static createOutputNeuron(
        name: string,
        threshold: string,
        stimulation?: string,
        toneString?: string
    ): OutputNeuron {
        // Start with base neuron
        const baseNeuron = App.createNeuron(name, threshold, stimulation);

        // Add output-specific properties
        return {
            ...baseNeuron,
            rows: toneString ? App.parseToneRows(toneString) : [],
            currentNote: 0,
            currentRow: 0,
        };
    }

    static parse(line: string): Neuron | undefined {
        // regular neurons: "name threshold [stimulation] › dest1 len1 dest2 len2"
        const regularNeuronRegex = /\w+\s\d+(\s\d*)*\s›(\s\w+\s\d+)+/;

        // output neurons: "name threshold [stimulation] » [note1 note2] [note3 note4]"
        const outputNeuronRegex = /\w+\s\d+(\s\d*)*\s»\s*(\[[\w#\d\s]+\])*\s*/;

        if (outputNeuronRegex.test(line)) {
            // output neuron
            let [neuronString, toneString] = line.split('»');
            if (neuronString) {
                let [name, threshold, stimulation] = neuronString.split(' ');
                let neuron = App.createOutputNeuron(
                    name,
                    threshold,
                    stimulation,
                    toneString
                );
                return neuron;
            }
        } else if (regularNeuronRegex.test(line)) {
            // regular neuron
            let [neuronString, connectionString] = line.split('›');
            if (neuronString) {
                let [name, threshold, stimulation] = neuronString.split(' ');
                let neuron = App.createNeuron(name, threshold, stimulation);
                neuron.connections = App.parseConnections(connectionString);
                return neuron;
            }
        } else return undefined;
    }

    static describe(neuron: Neuron) {
        let connectionString = '';
        for (const connection of neuron.connections) {
            connectionString += `[${connection.destination} ⟿ ${connection.length}] `;
        }
        const out = `${neuron.name} ${neuron.threshold} ➤ ${connectionString}\n`;
        return out;
    }

    static parseInput(text: string) {
        let lineCount = 1; // rough estimate of lines

        // split input into lines
        let lines = text.split('\n');

        // init
        let neurons = new Map<string, Neuron>();
        let output = '';

        // for each line
        for (const line of lines) {
            lineCount += 1 + Math.floor(line.length / 38);

            // parse string into neuron
            let neuron = this.parse(line);
            if (neuron) {
                let existing = neurons.get(neuron.name);
                if (existing) {
                    neuron.activation = existing.activation;
                }
                neurons.set(neuron.name, neuron);

                // print neuron
                output += this.describe(neuron);
            }
        }

        let graph: GraphData = {
            nodes: [],
            links: [],
        };

        neurons.forEach((neuron) => {
            graph.nodes.push({
                id: neuron.name,
                name: neuron.name,
                val: neuron.activation,
            });

            neuron.connections.forEach((connection) => {
                if (neurons.has(connection.destination)) {
                    graph.links.push({
                        source: neuron.name,
                        target: connection.destination,
                    });
                }
            });
        });

        return {
            value: text,
            output: output,
            rows: lineCount,
            neurons: neurons,
            graph: graph,
        };
    }

    render() {
        return (
            <div className='App'>
                <div className='App-controlColumn'>
                    <div>
                        <textarea
                            className='App-entryArea App-textArea'
                            rows={this.state.rows}
                            value={this.state.value}
                            onChange={this.handleChange}
                        />
                    </div>
                    {/* <div className='App-control-description'>
                        <p>
                            Define nodes like this: [name] [threshold]
                            [self-stimulation-period] &gt; [destination]
                            [length]
                        </p>
                        <p>Note names will emit sounds.</p>
                        <p>
                            For more stimulation, use the form below to enter
                            node names.
                        </p>
                    </div> */}
                    <div>
                        <textarea
                            className='App-stimulusArea App-textArea'
                            rows={4}
                            value={this.state.stimulus}
                            onChange={this.handleStimulusChange}
                        />
                        <textarea
                            className='App-statusArea App-textArea'
                            rows={4}
                            value={this.state.status}
                            readOnly
                        />
                    </div>
                </div>

                <div className='App-neuronColumn'>
                    <div className='App-neuronStack'>
                        {Array.from(this.state.neurons.values()).map((v, k) => (
                            <NeuronComponent key={k} neuron={v} />
                        ))}
                    </div>
                </div>

                <div className='App-graphColumn'>
                    <GraphComponent
                        graph={this.state.graph}
                        neurons={this.state.neurons}
                    />
                    {/* <textarea
                        className='App-outputArea App-textArea'
                        rows={this.state.rows}
                        value={this.state.output}
                        readOnly
                    /> */}
                </div>
            </div>
        );
    }
}

export { Neuron, App as default };
