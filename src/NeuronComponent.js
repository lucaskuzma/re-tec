import { Component } from 'react';
import Connection from './Connection';
import './NeuronComponent.css'

class NeuronComponent extends Component {
    constructor(props) {
        super(props)
        this.tick = this.tick.bind(this);
    }

    tick() {

    }

    render() {
        return (
            <div className='Neuron'>
                🧠 {this.props.neuron.name} {this.props.neuron.threshold} α {this.props.neuron.activation}
                {this.props.neuron.firing &&
                    <span> 🔥</span>
                }
                {this.props.neuron.connections.map(connection => <Connection key={connection.destination} connection={connection}/>)}
            </div>
        )
    }
}

export default NeuronComponent
