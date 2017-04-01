function Gossiper(id, info) {
  this.id = id;
  this.info = info;
  this.neighbors = [];
  this.broadcastCount = 100;
}

Gossiper.prototype.gossip = function() {
  if (this.broadcastCount < this.neighbors.length) {
    for (var i = 0; i < this.broadcastCount; i++) {
      var neighbor = this.neighbors[Math.floor(Math.random() * this.neighbors.length)];
      neighbor.tell(this.info);
    }
  } else {
    for (var i = 0; i < this.neighbors.length; i++) {
      var neighbor = this.neighbors[i];
      neighbor.tell(this.info);
    }
  }
};

Gossiper.prototype.tell = function(message) {
  if (message.time > this.info.time) {
    this.info.time = message.time;
    this.info.color = message.color;
  }
};

function Link(source, target) {
  this.source = source;
  this.target = target;
  this.lastUse = 0;
  this.delay = 400 + Math.random() * 400;
}

Link.prototype.tell = function(message) {
  if (this.delay + this.lastUse > Date.now()) {
    return;
  }
  this.lastUse = Date.now();
  var target = this.target;
  if (this.delay > 0) {
    setTimeout(function() {
      target.tell(message);
    }, this.delay);
  } else {
    target.tell(message);
  }
};

var width = 800;
var height = 800;

function createRing(count, ringType) {
  var gossipers = [];
  var links = [];

  for (var i = 0; i < count; i++) {
    var gossiper = new Gossiper(i, {
      time: 0,
      color: 'rgba(255, 127, 0)'
    });
    gossiper.x = Math.cos(i / count * 2 * Math.PI) * 200 + width / 2;
    gossiper.y = Math.sin(i / count * 2 * Math.PI) * 200 + height / 2;
    gossipers.push(gossiper);
  }
  gossipers[0].info.time = 1;
  gossipers[0].info.color = 'rgba(0, 10, 255)';

  for (var i = 0; i < count; i++) {
    var gossiper = gossipers[i];
    if (ringType === 'log') {
      for (var j = 1; j < count; j *= 2) {
        var link = new Link(gossiper, gossipers[(i + j) % gossipers.length]);
        gossiper.neighbors.push(link);
        links.push(link);
      }
    } else if (ringType === 'single') {
      for (var j = -1; j < 2; j += 2) {
        var link = new Link(gossiper, gossipers[(i + j + gossipers.length) % gossipers.length]);
        gossiper.neighbors.push(link);
        links.push(link);
      }
    } else if (ringType === 'log up to 4') {
      for (var j = 1; j < 8; j *= 2) {
        var link = new Link(gossiper, gossipers[(i + j) % gossipers.length]);
        gossiper.neighbors.push(link);
        links.push(link);
      }
    }
  }

  return {
    gossipers: gossipers,
    links: links
  };
}

function getColor(node) {
  return node.info.color;
}

function getSourceX(link) {
  return link.source.x;
}

function getSourceY(link) {
  return link.source.y;
}

function getTargetX(link) {
  return link.target.x;
}

function getTargetY(link) {
  return link.target.y;
}

function getY(node) {
  return node.y;
}

function getX(node) {
  return node.x;
}

function Simulation(gossipers, links) {
  this.gossipers = gossipers;
  this.links = links;

  var svg = d3.select('body').append('svg')
    .attr('width', width)
    .attr('height', height);

  var force = d3.forceSimulation()
    .force('charge', d3.forceManyBody().strength(-50))
    .force('center', d3.forceCenter(width / 2, height / 2))

  force.nodes(gossipers);
  // force.force('link')
  //   .links(links);

  this.link = svg.selectAll('.link')
    .data(this.links)
    .enter()
      .append('line')
      .attr('class', 'link')
      .attr('stroke', 'black');

  this.node = svg.selectAll('.node')
    .data(this.gossipers)
    .enter()
      .append('circle')
      .attr('r', 40)
      .attr('class', 'node');

  this.update = this.update.bind(this);
}

Simulation.prototype.update = function() {
  this.link.attr('x1', getSourceX)
    .attr('y1', getSourceY)
    .attr('x2', getTargetX)
    .attr('y2', getTargetY);

  this.node.attr('cx', getX)
    .attr('cy', getY)
    .attr('fill', getColor);

  this.gossip();

  window.requestAnimationFrame(this.update);
};

Simulation.prototype.gossip = function() {
  var allSame = this.gossipers[0].info.color;
  for (var i = 0; i < this.gossipers.length; i++) {
    if (allSame !== this.gossipers[i].info.color) {
      allSame = null;
    }
    this.gossipers[i].gossip();
  }

  if (allSame) {
    var color = 'hsl(' + Math.floor(Math.random() * 360) + ',100%,50%)';
    this.gossipers[0].info.time += 1;
    this.gossipers[0].info.color = color;
  }
};


var ringLog = createRing(20, 'log');
var ringSingle = createRing(20, 'single');
var ringLog4 = createRing(20, 'log up to 4');

var simLog = new Simulation(ringLog.gossipers, ringLog.links);
var simLog4 = new Simulation(ringLog4.gossipers, ringLog4.links);
var simSingle = new Simulation(ringSingle.gossipers, ringSingle.links);

simLog.update();
simLog4.update();
simSingle.update();

