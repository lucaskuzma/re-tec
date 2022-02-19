import { Component } from "react";

class Neuron extends Component {
    constructor(props) {
        super(props)
        this.tick = this.tick.bind(this);
    }

    tick() {
        
    }

    render() {
        return (
            <div className="Neuron">
                Hello
                { this.props }
            </div>
        )
    }
}

export default Neuron
