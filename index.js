var drop = require('drag-and-drop-files');
var d3 = require('d3');


drop(document.getElementById('drop'), function(files) {
  var first = files[0];
  console.log(first)
  fileReader = new FileReader();
  fileReader.onloadend = function(e){
    graph = JSON.parse(e.target.result)
    tmp = get_graph_metadata(graph)
    node_keys = tmp[0]
    edge_keys = tmp[1]
    
    create_graph("graphDiv",graph,300,600)
  }
  fileReader.readAsText(first);

});

function uniq(arr){
  function onlyUnique(value, index, self) {
    return self.indexOf(value) === index;
  }
  return arr.filter( onlyUnique );
}

function get_graph_metadata(graph){
  node_keys = []
  i = graph.nodes.length;
  while(i--){
    node_keys = node_keys.concat(Object.keys(graph.nodes[i]))
  }
  node_keys = uniq(node_keys).filter(d => d!="id")

  edge_keys = []
  i = graph.edges.length;
  while(i--) {
    edge_keys = node_keys.concat(Object.keys(graph.edges[i]))
  }
  edge_keys = uniq(edge_keys).filter(d => d!="source" && d!="target")

  return [node_keys,edge_keys]

}




function create_graph(graphDiv,data,height,width){

  var radius=5;
  var defaultNodeCol="white";
  var highlightCol="yellow";

  var graphCanvas = d3.select('#'+graphDiv).append('canvas')
  .attr('width', width + 'px')
  .attr('height', height + 'px')
  .style('background-color', "black")
  .node();

  var context = graphCanvas.getContext('2d');

  var div = d3.select("body").append("div")
      .attr("class", "tooltip")
      .style("opacity", 0);


  var simulation = d3.forceSimulation()
                .force("center", d3.forceCenter(width / 2, height / 2))
                .force("x", d3.forceX(width / 2).strength(0.1))
                .force("y", d3.forceY(height / 2).strength(0.1))
                .force("charge", d3.forceManyBody().strength(-50))
                .force("link", d3.forceLink().strength(1).id(function(d) { return d.id; }))
                .alphaTarget(0)
                .alphaDecay(0.05)

  var transform = d3.zoomIdentity;
  function redraw(){
    simulation.alphaTarget(0.3).restart()
  }

  function initGraph(){

    console.log(data)
    function zoomed() {
      console.log("zooming")
      transform = d3.event.transform;
      simulationUpdate();
    }

    d3.select(graphCanvas)
        .call(d3.drag().subject(dragsubject).on("start", dragstarted).on("drag", dragged).on("end",dragended))
        .call(d3.zoom().scaleExtent([1 / 10, 8]).on("zoom", zoomed))



  function dragsubject() {
    var i,
    x = transform.invertX(d3.event.x),
    y = transform.invertY(d3.event.y),
    dx,
    dy;
    for (i = data.nodes.length - 1; i >= 0; --i) {
      node = data.nodes[i];
      dx = x - node.x;
      dy = y - node.y;

      if (dx * dx + dy * dy < radius * radius) {

        node.x =  transform.applyX(node.x);
        node.y = transform.applyY(node.y);

        return node;
      }
    }
  }


  function dragstarted() {
    if (!d3.event.active) simulation.alphaTarget(0.3).restart();
    d3.event.subject.fx = transform.invertX(d3.event.x);
    d3.event.subject.fy = transform.invertY(d3.event.y);
  }

  function dragged() {
    d3.event.subject.fx = transform.invertX(d3.event.x);
    d3.event.subject.fy = transform.invertY(d3.event.y);

  }

  function dragended() {
    if (!d3.event.active) simulation.alphaTarget(0);
    d3.event.subject.fx = null;
    d3.event.subject.fy = null;
  }

    simulation.nodes(data.nodes)
              .on("tick",simulationUpdate);

    simulation.force("link")
              .links(data.edges);



    function render(){

    }

    function simulationUpdate(){
      context.save();

      context.clearRect(0, 0, width, height);
      context.translate(transform.x, transform.y);
      context.scale(transform.k, transform.k);

      data.edges.forEach(function(d) {
            context.beginPath();
            context.moveTo(d.source.x, d.source.y);
            context.lineTo(d.target.x, d.target.y);
            context.strokeStyle = "white"
            context.stroke();

        });

        // Draw the nodes
        data.nodes.forEach(function(d, i) {

            context.beginPath();
            context.arc(d.x, d.y, radius, 0, 2 * Math.PI, true);
            context.fillStyle = d.col ? d.col:"white"
            context.fill();
        });

        context.restore();
  //        transform = d3.zoomIdentity;
    }
    simulation.alphaTarget(0.3).restart()
  }

  initGraph()
}
