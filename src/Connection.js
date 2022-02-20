import { Component } from "react";

class Connection extends Component {
    constructor(props) {
        super(props)
        this.tick = this.tick.bind(this);
    }

    tick() {

    }

    render() {
        return (
            <div className="Connection">
                ➤ {this.props.connection.destination} ↻ {this.props.connection.length} α {this.props.connection.progress}
                {this.props.connection.signals && 
                    this.props.connection.signals.map(signal => <span key={signal.key}>{signal.progress} </span>)
                }
            </div>
        )
    }
}

export default Connection
