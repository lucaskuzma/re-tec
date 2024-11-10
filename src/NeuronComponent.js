import { Component } from 'react';
import Connection from './Connection';
import './NeuronComponent.css';

class NeuronComponent extends Component {
    constructor(props) {
        super(props);
        this.tick = this.tick.bind(this);
    }

    tick() {}

    render() {
        return (
            <div className={`Neuron ${this.props.neuron.firing ? 'firing-bg' : ''} ${this.props.isOutput ? 'output-neuron' : ''}`}>
                {/* {this.props.neuron.firing ? <span>🔥</span> : <span>🧠</span>}{' '} */}
                {this.props.neuron.name}
                &nbsp;[{'▪'.repeat(Math.floor(this.props.neuron.activation))}
                {'▫'.repeat(Math.max(this.props.neuron.threshold - Math.floor(this.props.neuron.activation), 0))}] {Math.floor(this.props.neuron.activation)} /{' '}
                {this.props.neuron.threshold}
                {this.props.isOutput
                    ? ` [${this.props.neuron.currentNote}, ${this.props.neuron.currentRow}] ${(() => {
                          const notes = this.props.neuron.rows[this.props.neuron.currentRow]?.notes || [];
                          const currentNote = this.props.neuron.currentNote;
                          return notes.map((note, index) => (index === currentNote ? `(${note})` : note)).join(' ');
                      })()}`
                    : ''}
                {this.props.neuron.connections.map((connection) => (
                    <Connection key={connection.destination} connection={connection} />
                ))}
            </div>
        );
    }
}

export default NeuronComponent;
