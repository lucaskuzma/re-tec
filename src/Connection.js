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
                ➤ {this.props.connection.destination} ↻ {this.props.connection.length}
            </div>
        )
    }
}

export default Connection
