import { Component } from 'react';
import ForceGraph3D, { GraphData } from 'react-force-graph-3d';
import SpriteText from 'three-spritetext';
import React from 'react';
import { Neuron } from './App';

type GraphProps = {
    graph: GraphData;
    neurons: Map<string, Neuron>;
};

type GraphState = {
    graph: GraphData;
    neurons: Map<string, Neuron>;
};

class GraphComponent extends Component<GraphProps, GraphState> {
    constructor(props) {
        super(props);
        this.state = {
            graph: props.graph,
            neurons: props.neurons,
        };
    }

    render() {
        return (
            <div className="App-graph">
                <ForceGraph3D
                    graphData={this.state.graph}
                    //   nodeVal={node => this.state.neurons.get(node.id as string).activation * 2}
                    nodeLabel={(node) => {
                        const nodeId = node.id as string;
                        const neuron = this.state.neurons.get(nodeId);
                        return neuron ? neuron.activation.toString() : '';
                    }}
                    nodeColor={(node) => {
                        const nodeId = node.id as string;
                        const neuron = this.state.neurons.get(nodeId);
                        return neuron && neuron.firing ? 'orange' : 'white';
                    }}
                    showNavInfo={false}
                    width={240}
                    height={240}
                    backgroundColor={'#f2f2f2'}
                    linkColor={'#000000'}
                    linkWidth={1}
                    linkOpacity={0.9}
                    linkDirectionalArrowLength={3.5}
                    linkDirectionalArrowRelPos={1}
                    linkCurvature={0.25}
                    nodeThreeObject={(node) => {
                        const nodeId = node.id as string;
                        const neuron = this.state.neurons.get(nodeId);
                        const sprite = new SpriteText(
                            neuron &&
                                nodeId + ' _ ' + Math.floor(neuron.activation)
                        );
                        sprite.color =
                            neuron && neuron.firing ? 'orange' : 'black';
                        sprite.textHeight = 12;
                        return sprite;
                    }}
                />
            </div>
        );
    }
}

export default GraphComponent;
