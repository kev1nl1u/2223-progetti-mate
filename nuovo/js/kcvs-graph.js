/*

  JavaScript functions for setting up a graph in D3 and inserting it into
  an HTML element.
  
  Requires d3.js.
  
  The Graph constructor creates an SVG object, adds axes, sets up the scales, 
  etc.
  
  USAGE: Create an object with the graph parameters (see code), and 
  do something like this:
    var awesomeGraph = new KCVSGraph(graphConfig);
  
  You can control the number format for the axes using xtickFormat and
  ytickFormat in the config object.  For example, to get an axis in years
  without thousands separators, use
    xtickFormat = "d"
  For more details, see:
    https://github.com/d3/d3-axis#axis_tickFormat
    https://github.com/d3/d3-format#locale_format
  (More general time-format axes are not yet implemented.)
  
  You can access the SVG context directly with
    awesomegraph.svg
  or use the usual d3 selectors.
  
  Currently if you want a title you should put a header element above the graph.
  
  Functions include:
  - addLine(obj)  ("obj" = config object w/ x & y arrays, and other param's)
  - markerLines(markerClass, posArr, axis, slowUpdate)
  - markerCircles(circleClass, x, y, r, delay, slowUpdate) <-- Use for points.
  - updateLine(id, newx, newy, slowUpdate)
  - showLines(selector)
  - hideLines(selector)
  - removeLines(selector)
  where "selector" is a CSS selector (ID with # or class with .).
  Note that only items contained within this graph are selected,
  even if the page has other items with the selected class.


  === Changelog ===
  
  Dec 2018: Implemented show/hide/removeLines functions.  -Robert MacDonald, KCVS.
  
  Summer 2018: Initial code.  -Robert MacDonald, KCVS.

*/


/////////////////
// CONSTRUCTOR //
/////////////////
/**
 * Sets up the graph's SVG object, axes, labels, title, etc.
 * Returns an accessor object for your convenience.
 */
function KCVSGraph(config) {

  //////////////////////////////////////////////////
  // Internal variables.
  
  var theGraph = this; // So we can access this object from inside these functions.
  
  
  //////////////////////////////////////////////////
  // Process config parameters.
  
  // First define variables and set defaults.
  this.containerID = ""; // Graph will be inserted into this element.
  this.graphID = ""; // ID for the SVG context for the graph.
  this.width = ""; // Outer dim. If blank, will be taken from container (may be 0!).
  this.height = ""; // Outer dim. If blank, will be taken from container (may be 0!).
  this.gmargin = {top: 10, right: 10, bottom: 40, left: 60}; // graph area margins
  this.xmin = 0;
  this.xmax = 1;
  this.ymin = 0;
  this.ymax = 1;
  this.xlabel = '';
  this.ylabel = '';
  this.xticks = 5; // Number of ticks on axis.  Auto if 0.
  this.yticks = 5; // Number of ticks on axis.  Auto if 0.
  this.xtickFormat = null; // Number format for tick-mark labels.  See d3-format.
  this.ytickFormat = null; // Number format for tick-mark labels.  See d3-format.
  this.zeroLine = true; // If true, adds a line across y=0.
  this.sortLinesByX = true; // Sort line data by increasing x value.
  this.fastTransition = 50; // Animation duration (ms)
  this.slowTransition = 600; // For slower animations, e.g. enter/exit.
  
  // Now check for overrides in config.
  for (var key in this) {
    if (config.hasOwnProperty(key)) {
      this[key] = config[key];
    }
  }

  // Make sure we have a target container.
  if (!(this.containerID.length > 0)) {
    console.error("Bork! Must specify containerID to place slider!");
    return;
  } 
  this.container = $('#' + this.containerID);
  if (!(this.container.length > 0)) {
    console.error("Bork! No element found with ID=" + this.containerID);
    return;
  }
  
  if (this.graphID == '') {
    this.graphID = this.containerID + "graph";
  }

  if (this.width == '') {
    this.width = $('#'+this.containerID).width();
  }
  if (this.height == '') {
    this.height = $('#'+this.containerID).height();
  }

  // Make a wrapper div around the graph.
  // This makes it easier to position other HTML elements like messages
  // over top of the graph.  (You can't put HTML inside SVG.)
  this.wrapperID = this.graphID + 'Wrapper';
  this.wrapper = $('<div></div>')
    .attr('id', this.wrapperID)
    .attr('class', 'kcvsGraphWrapper')
    .appendTo(this.container);

  //////////////////////////////////////////////////
  // Create the SVG region everything else will be built into.
  // Follows Mike Bostock's "conventional margins" approach:
  //   https://bl.ocks.org/mbostock/3019563

  // TODO: Change this into a "render" or "updateDimensions" function.
  
  // (Make the margins argument optional.)  This same function can be used to
  // adjust size and spacing when the graph is resized (e.g. on window resize).
  // Re-call the axis scales and the axis functions themselves to re-draw the
  // axes in the proper font size.  A good example is here:
  // https://blog.webkid.io/responsive-chart-usability-d3/ I think I'd also like
  // to (by default) define the margins in terms of lines; I _think_ there's a
  // way to get the "calculated height" and "calculated width" of an SVG text
  // element, at least in D3...?
  
  this.setMargins = function(m) {
    this.gmargin.left = m.left;
    this.gmargin.right = m.right;
    this.gmargin.top = m.top;
    this.gmargin.bottom = m.bottom;
    this.graphWidth = this.width - this.gmargin.left - this.gmargin.right;
    this.graphHeight = this.height - this.gmargin.top - this.gmargin.bottom;
    d3.select('#'+this.graphID+'Margin')
      .attr("transform", "translate(" + this.gmargin.left + "," + this.gmargin.top + ")");
  }

  this.svg = d3.select('#'+this.wrapperID).append("svg")
    // .attr('width', '100%')
    // .attr('height', '100%')
    .attr('viewBox', '0 0 ' + this.width + ' ' + this.height)
    // .attr('viewBox', '0 0 100 100')
    // .attr('preserveAspectRatio', 'xMinYMin meet')
    .attr('preserveAspectRatio', 'xMidYMid meet')
    .attr('id', this.graphID)
    .classed('kcvsGraph', true)
    .append("g")
      .attr('id', this.graphID+'Margin');
  this.setMargins(this.gmargin);
  
  // Attach a clipPath to prevent drawing outside the graph.
  this.svg.append('clipPath')
    .attr('id', this.graphID+'Clip')
    .append('rect')
      .attr('width', this.graphWidth)
      .attr('height', this.graphHeight);
  
  //////////////////////////////////////////////////
  // Create scales and axes.
  
  this.xScale = d3.scaleLinear()
    .domain([this.xmin, this.xmax])
    .range([0, this.graphWidth]);
  this.yScale = d3.scaleLinear()
    .domain([this.ymin, this.ymax])
    .range([this.graphHeight, 0]);

  // D3 axis generators.
  // Used for modifying axis properties (tick marks etc).
  this.xAxis = d3.axisBottom(this.xScale);
  this.yAxis = d3.axisLeft(this.yScale);
  
  if (this.xticks > 0) this.xAxis = this.xAxis.ticks(this.xticks, this.xtickFormat);
  if (this.yticks > 0) this.yAxis = this.yAxis.ticks(this.yticks, this.ytickFormat);
  
  // SVG groups containing each axis.
  this.xAxisG = this.svg.append('g')
    .attr('transform', 'translate(0,' + this.graphHeight + ')')
    .attr('id', this.graphID+'Xaxis')
    .attr('class', 'kcvsAxis xAxis')
    .call(this.xAxis);
  if (this.xlabel.length > 0 && $(".darkMode")[0]) {
    this.xAxisG.append('text')
      .attr('transform', 'translate(' + this.graphWidth + ', 0)')
      .attr('dy', '2.5em')
      .attr('text-anchor', 'end')
      .attr('fill', '#d2d2d2') // text color (?!)
      .attr('class', 'kcvsAxisLabel')
      .text(this.xlabel);
  }
  else if(this.xlabel.length > 0){
    this.xAxisG.append('text')
      .attr('transform', 'translate(' + this.graphWidth + ', 0)')
      .attr('dy', '2.5em')
      .attr('text-anchor', 'end')
      .attr('fill', '#000') // text color (?!)
      .attr('class', 'kcvsAxisLabel')
      .text(this.xlabel);
  }

  this.yAxisG = this.svg.append('g')
    .attr('id', this.graphID+'Yaxis')
    .attr('class', 'kcvsAxis yAxis')
    .call(this.yAxis);
  if (this.ylabel.length > 0 && $(".darkMode")[0]) {
    this.yAxisG.append('text')
      .attr('dy', '-2.5em')
      .attr('transform', 'rotate(-90)')
      .attr('text-anchor', 'end')
      .attr('fill', '#d2d2d2') // text color (?!)
      .attr('class', 'kcvsAxisLabel')
      .text(this.ylabel);
  }
  else if (this.ylabel.length > 0) {
    this.yAxisG.append('text')
      .attr('dy', '-2.5em')
      .attr('transform', 'rotate(-90)')
      .attr('text-anchor', 'end')
      .attr('fill', '#000') // text color (?!)
      .attr('class', 'kcvsAxisLabel')
      .text(this.ylabel);
  }
  

  ////////////////////////////////////////////////////////////
  // General accessors
  
  // These get the actual axis limits (after "nice").
  this.getXmin = function() { return theGraph.xScale.domain()[0]; }
  this.getXmax = function() { return theGraph.xScale.domain()[1]; }
  this.getYmin = function() { return theGraph.yScale.domain()[0]; }
  this.getYmax = function() { return theGraph.yScale.domain()[1]; }
  
  
  //////////////////////////////////////////////////
  // Helper functions.  Mainly internal, but the x-generator is handy.
  
  // Generate the requested number of x-values spanning the current axis limits.
  // Includes xmin and xmax (so an odd number works best).
  this.generateXarray = function(n) {
      // Initialize empty array.
      var x = new Array(n);
      // n values means n-1 intervals, and dx is the size of one interval.
      var dx = (this.getXmax() - this.getXmin())/(n-1);
      for (var i = 0; i < n; i++) {
        x[i] = this.getXmin() + i*dx;
      }
      return x;
  }

  
  // Combine two arrays into an array of {x,y} pairs for D3 to work with.
  this.arrays2d3 = function(xname, x, yname, y) {
    var pairs = d3.zip(x, y)
      .map(function(d) { 
        var pair = {};
        pair[xname] = d[0];
        pair[yname] = d[1];
        return pair;
      });
    if (this.sortLinesByX) {
      pairs.sort(function(a,b) {
        if (Number.isFinite(a[xname])) {
          return a[xname] - b[xname];
        } else {
          return 0;
        }
      });
    }
    return pairs;
  }


  // Remove data points with Infinity's and NaN's.
  // Infinity's are replaced with y>ymax so you can see the graph go off-scale.
  this.removeInfinity = function(x, y) {
    var finiteData = {x:[], y:[]};
    for (var i = 0; i < x.length; i++) {
      if (Number.isFinite(x[i]) && Number.isFinite(y[i])) {
        finiteData.x.push(x[i]);
        finiteData.y.push(y[i]);
      } else if (y[i] === Infinity) {
        finiteData.x.push(x[i]);
        finiteData.y.push(1.5*theGraph.getYmax());
      }
    }
    return finiteData;
  }


  // Useful for making flat lines, e.g. for transitions.
  this.zeroArray = function(n) {
    var arr = [];
    for (var i = 0; i < n; i++) {
      arr.push(0);
    }
    return arr;
  }

  
  // Line generator function for D3.
  this.line = d3.line()
    .x(function(d){ return theGraph.xScale(d.x); })
    .y(function(d){ return theGraph.yScale(d.y); });
  
  
  // Add the appropriate clip-path attribute to any SVG element.  Also useful
  // when adding your own elements to an existing graph directly.
  // INPUT: selection is a D3 selection.
  this.applyClipPath = function(selection) {
    selection.attr('clip-path', 'url(#'+this.graphID+'Clip)');
  }
  
  ////////////////////////////////////////////////////////////
  // Add another line to the graph.
  
  // At minimum, obj should contain "x" and "y" parallel arrays.
  this.addLine = function(obj) {
    var finiteData = this.removeInfinity(obj.x, obj.y);
    var datapairs = this.arrays2d3('x', finiteData.x, 'y', finiteData.y);
    var flatpairs = this.arrays2d3('x', finiteData.x, 'y', this.zeroArray(finiteData.x.length));
    
    var lineClasses = 'line kcvsGraphTempNewLine';
    if (obj.hasOwnProperty('class')) lineClasses = lineClasses + ' ' + obj.class;
    
    var newline = this.svg.append('path')
      .attr('class', lineClasses)
      .attr('clip-path', 'url(#'+this.graphID+'Clip)')
      .attr('fill', 'none')
      .attr('stroke', 'black')
      .attr('d', this.line(flatpairs))
      .datum(datapairs);
    
    d3.select('.kcvsGraphTempNewLine')
    .transition()
      .duration(this.slowTransition)
      .ease(d3.easeBackInOut)
      .attr('d', this.line(datapairs));

    newline.classed('kcvsGraphLine', true);
    newline.classed('kcvsGraphTempNewLine', false); // Remove the dummy class.
    
    if (obj.hasOwnProperty('id')) { 
      newline.attr('id', obj.id);
    } else {
      newline.attr('id', ''); // Remove the dummy ID.
    }
    
    // Return the new line object for further adjustments.
    return newline;
  } // addLine function


  ////////////////////////////////////////////////////////////
  // Update the line with the given ID.

  // - slowUpdate: OPTIONAL boolean.  If true, update uses slowTransition.
  // You can also pass the arguments in the form of a single object.
  // If only one argument is provided, will assume it's such an object.
  // This way you can use the same object you used for addLine.
  this.updateLine = function(id, x, y, slowUpdate) {
    
    // If the options were passed in an object, parse it out.
    if (arguments.length == 1) {
      var obj = arguments[0];
      id = obj.id;
      x = obj.x;
      y = obj.y;
      slowUpdate = obj.slowUpdate; // may be undefined.
    }

    var trans;
    if (slowUpdate) { // False if slowUpdate was not supplied.
      trans = theGraph.slowTransition;
    } else {
      trans = theGraph.fastTransition;
    }
    var finiteData = this.removeInfinity(x, y);
    var datapairs = theGraph.arrays2d3('x', finiteData.x, 'y', finiteData.y);
    d3.select('#'+id)
      .transition()
      // .duration(theGraph.fastTransition)
      .duration(trans)
      .attr('d', theGraph.line(datapairs));
  };


  ////////////////////////////////////////////////////////////
  // Add or update a set of horizontal or vertical lines at the given positions.
  // Each line gets the specified class; lines of this class will be added or
  // removed automatically to match the number of entries.
  // Note: vertical lines mark x-values, horizontal lines mark y-values.
  // INPUTS:
  // - markerClass: Class for the marker lines.
  // - posArr: array of x- or y-values for each marker line.
  // - axis: 'x' for vertical lines, 'y' for horizontal lines.
  // - slowUpdate: OPTIONAL boolean.  If true, update uses slowTransition.
  // RETURNS:
  // - The D3 selection of affected marker lines.
  // You can also pass the arguments in the form of a single object.
  // If only one argument is provided, will assume it's such an object.
  this.markerLines = function(markerClass, posArr, axis, slowUpdate) {
    
    // If the optiosn were passed in an object, parse it out.
    if (arguments.length == 1) {
      var obj = arguments[0];
      markerClass = obj.markerClass;
      posArr = obj.posArr;
      axis = obj.axis;
      slowUpdate = obj.slowUpdate; // may be undefined.
    }
    
    if (axis !== 'x' && axis !== 'y') {
      console.error('Bork! axis = ' + axis + ' but should be x or y.');
      return;
    }
    
    // How far to shift the lines when moving on/off stage.
    var yjump = 1.1*(theGraph.getYmax() - theGraph.getYmin());
    
    // Transition timings
    var t;
    if (slowUpdate) {
      t = d3.transition().duration(this.slowTransition);
    } else {
      t = d3.transition().duration(this.fastTransition);
    }
    var tslow = d3.transition().duration(this.slowTransition);
    var te = d3.easeBackOut.overshoot(1.2);

    // Use the array indices as "keys" to identify lines during later updates.
    // They aren't necessarily stored in array order, so we need this to update
    // the correct lines!
    var pos = posArr.map(function(p, i) {
      // return {key: i, val: p};
      point = {};
      point.key = i;
      if (axis === 'x') {
        point.x1 = p;
        point.x2 = p;
        point.y1 = theGraph.getYmin();
        point.y2 = theGraph.getYmax();
      } else {
        point.x1 = theGraph.getXmin();
        point.x2 = theGraph.getXmax();
        point.y1 = p;
        point.y2 = p;
      }
      return point;
    });
    
    // JOIN new data with old elements.
    var lines = this.svg.selectAll('.'+markerClass)
      .data(pos, function(d){ return d.key; });
    
    // EXIT old elements not present in new data.
    lines.exit()
      .transition(tslow)
        .ease(te)
        .style('opacity', 1e-6)
        .attr('y1', function(d) {return theGraph.yScale(d.y1+yjump); })
        .attr('y2', function(d) {return theGraph.yScale(d.y2+yjump); })
        .remove();
    
    // UPDATE old elements present in new data.
    lines.transition(t)
      .ease(te)
      .style('opacity', 1)
      .attr('x1', function(d) { return theGraph.xScale(d.x1); })
      .attr('x2', function(d) { return theGraph.xScale(d.x2); })
      .attr('y1', function(d) { return theGraph.yScale(d.y1); })
      .attr('y2', function(d) { return theGraph.yScale(d.y2); })
      .attr('data-n', function(d) { return d.key; });
    
    // ENTER new elements present in new data.
    lines.enter().append('line') // SVG line object.
      .style('opacity', 1e-6)
      .attr('class', markerClass)
      .attr('fill', 'none')
      .attr('x1', function(d) { return theGraph.xScale(d.x1); })
      .attr('x2', function(d) { return theGraph.xScale(d.x2); })
      .attr('y1', function(d) {return theGraph.yScale(d.y1+yjump); })
      .attr('y2', function(d) {return theGraph.yScale(d.y2+yjump); })
      .transition(tslow)
        .ease(te)
        .style('opacity', 1)
        .attr('y1', function(d) { return theGraph.yScale(d.y1); })
        .attr('y2', function(d) { return theGraph.yScale(d.y2); });
    
    return lines;
  } // markerLines function
  
  
  // Add the zero line if selected.
  if (this.zeroLine) this.addLine({
    'x': [this.getXmin(), this.getXmax()],
    'y': [0, 0],
    'class': 'kcvsZeroLine',
    // 'strokeWidth': 1
  });
  

  ////////////////////////////////////////////////////////////
  // Add or update a set of circles at the given positions and sizes. Each
  // circle gets the specified class; circles of this class will be added or
  // removed automatically to match the number of entries.  Positions are
  // specified as parallel arrays of x- and y-values.  Note that x and y are
  // in appropriate data units, but r should be in pixels.  The delay is in case
  // you want e.g. the marker circles to appear after the lines are in place.
  // (It may be worth modifying this later to work for arbitrary shapes.)
  // INPUTS:
  // - circleClass: Class for the circles.
  // - x, y: Parallel arrays of x and y values for the circles.
  // - r: Circle radius in PIXELS.  Can be a single value, or an array.
  // - delay: OPTIONAL delay time.  Defaults to 0.
  // - slowUpdate: OPTIONAL boolean.  If true, update uses slowTransition.
  // RETURNS:
  // - The D3 selection of affected circles.
  this.markerCircles = function(circleClass, x, y, r, delay, slowUpdate) {
    
    // If the optiosn were passed in an object, parse it out.
    if (arguments.length == 1) {
      var obj = arguments[0];
      circleClass = obj.circleClass;
      x = obj.x;
      y = obj.y;
      r = obj.r;
      delay = obj.delay;
      slowUpdate = obj.slowUpdate; // may be undefined.
    }
    
    // Transition timings.
    var t;
    if (slowUpdate) {
      t = d3.transition().duration(this.slowTransition);
    } else {
      t = d3.transition().duration(this.fastTransition);
    }
    var tslow = d3.transition().duration(this.slowTransition);
    var te = d3.easeBackOut.overshoot(1.2);

    if (delay) {
      t.delay(delay);
      tslow.delay(delay);
    }

    // Make the array of long-format data points for D3 to work with.
    var dataPairs = this.arrays2d3('x', x, 'y', y);
    
    // Attach extra information to each point.
    for (var i = 0; i < dataPairs.length; i++) {
      if (Array.isArray(r)) {
        dataPairs[i].r = r[i];
      } else {
        dataPairs[i].r = r;
      }
      // Use the array indices as "keys" to identify items during later updates.
      // They aren't necessarily stored in array order, so we need this to update
      // the correct items!
      dataPairs[i].key = i;
    }
    
    //////////////////////////////
    // Add/update the shapes!  Note that the location of an SVG circle is 
    // specified by (cx,cy) attributes.
    
    // JOIN new data with old elements.
    var shapes = this.svg.selectAll('.'+circleClass)
      .data(dataPairs, function(d){ return d.key; });
    
    // EXIT old elements not present in new data.
    shapes.exit()
      .transition(tslow)
        .ease(te)
        .style('opacity', 1e-6)
        .attr('r', 0)
        .remove();
    
    // UPDATE old elements present in the new data.
    shapes.transition(t)
      .ease(te)
      .style('opacity', 1)
      .attr('cx', function(d) { return theGraph.xScale(d.x); })
      .attr('cy', function(d) { return theGraph.yScale(d.y); })
      .attr('r', function(d) { return d.r; })
      .attr('data-n', function(d) { return d.key; });
    
    // ENTER new elements present in new data.
    shapes.enter().append('circle')
      .attr('class', circleClass)
      .attr('cx', function(d) { return theGraph.xScale(d.x); })
      .attr('cy', function(d) { return theGraph.yScale(d.y); })
      .style('opacity', 1e-6)
      .attr('r', 1e-6)
      .transition(tslow)
        .ease(te)
        .style('opacity', 1)
        .attr('r', function(d) { return d.r; });
    
    return shapes;
  } // markerCircles function


  ////////////////////////////////////////////////////////////
  // Hide or show lines or other items, by ID or by class.

  // Hide lines by ID or by class.
  // INPUTS:
  // - selector: CSS selector.  An ID should start with #, a class with .
  this.hideItems = function(selector) {
    d3.select('#'+theGraph.graphID).selectAll(selector).classed('kcvsGraph-hide', true);
  }

  // Show lines or other items, by ID or by class.
  // INPUTS:
  // - sel: CSS selector.  An ID should start with #, a class with .
  this.showItems = function(selector) {
    d3.select('#'+theGraph.graphID).selectAll(selector)
      .classed('kcvsGraph-hideLine', false);
  }


  ////////////////////////////////////////////////////////////
  // Completely remove one or more lines (by ID or by class).
  // Lines fade out in place; if you want them to move, use one of the 
  // update functions first to move them, then use removeLines.
  // INPUTS:
  // - selector: CSS selector.  An ID should start with #, a class with .
  this.removeLines = function(selector) {
    var tslow = d3.transition().duration(this.slowTransition);
    d3.select('#'+theGraph.graphID).selectAll(selector)
      .transition(tslow)
        .remove() // transition.remove removes line after transition is complete.
        .style('opacity', 1e-6);
  } // removeLines function
  
  ////////////////////////////////////////////////////////////
  // Get the current axis limits.
  this.getAxisLimits = function() {
    return {
      xmin: this.xmin,
      xmax: this.xmax,
      ymin: this.ymin,
      ymax: this.ymax
    };
  }
  
} // KCVSGraph constructor




