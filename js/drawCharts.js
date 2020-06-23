var pymChild = null;
var pulseData;
var h = 300,
    w = 320;

var margin = {
    top: 10,
    right: 10,
    bottom: 25,
    left: 25
},
    width = w - margin.left - margin.right,
    height = h - margin.top - margin.bottom;

var x = d3.scaleBand()
    .rangeRound([0, width])
    .padding(0.5)
    .domain(["wk1_2","wk2_3","wk3_4"]);

var y = d3.scaleLinear()
    .domain([0,1])
    .rangeRound([height, 0]);

function drawGraphic(containerWidth) {

    var example_data = pulseData.filter(function(d) { return d.geography === "MD" && (d.race_var === "asian" || d.race_var === "total") && d.metric === "uninsured"; });
console.log(example_data);
    var svg = d3.select(".chart.asian svg")
        .attr("width", w)
        .attr("height", h);

    var g = svg
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    g.append("g")
        .attr("transform", "translate(0," + height + ")")
        .call(d3.axisBottom(x));

    g.append("g")
        .call(d3.axisLeft(y));

    // draw margin of error bands
    g.selectAll(".moe")
        .data(example_data)
        .enter()
        .append("rect")
        .attr("class", function(d) { return d.race_var === "total" ? "tmoe" : "moe"; })
        .attr("x", function(d) { return x(d.week_num); })
        .attr("y", function(d) { return y(+d.moe_95_ub); })
        .attr("width", function(d) { return x.bandwidth(); })
        .attr("height", function(d) {
            return (+d.moe_95_lb < 0) ? y(0) -y(+d.moe_95_ub) : y(+d.moe_95_lb) - y(+d.moe_95_ub);
        })
        .classed("insig", function(d) { return (d.sigdiff === 0); });

    // draw point estimate dots
    g.selectAll(".dot")
        .data(example_data)
        .enter()
        .append("circle")
        .attr("class", function (d) { return d.race_var === "total" ? "tdot" : "dot"; })
        .attr("cx", function(d) { return x(d.week_num) + x.bandwidth()*.5; })
        .attr("cy", function(d) { return y(+d.mean); })
        .attr("r", 4)
        .classed("insig", function(d) { return (d.sigdiff === 0); });

    if (pymChild) {
        pymChild.sendHeight();
    }
}

d3.csv("data/data.csv", function(d) {
    return {
        geography: d.geography,
        metric: d.metric,
        week_num: d.week_num,
        race_var: d.race_var,
        mean: +d.mean,
        se: +d.se,
        moe_95: +d.moe_95,
        moe_95_lb: +d.moe_95_lb,
        moe_95_ub: +d.moe_95_ub,
        geo_type: d.geo_type,
        sigdiff: +d.sigdiff,
    };
}, function(error, data) {

    pulseData = data;

    pymChild = new pym.Child({renderCallback: drawGraphic });

    // pymChild.onMessage("stateSelected", updateTray);

});

d3.select("#metrics").on("change", function(){
    var m = this.value
    if(m == "all"){
        d3.selectAll(".metric").classed("hide", false)
    }else{
        d3.selectAll(".metric").classed("hide", true)
        d3.selectAll(".metric." + m).classed("hide", false)
    }
})

d3.select("#geographies").on("change", function(){
    var m = this.value.replace(/\W/g,'_')
    if(m == "all"){
        d3.selectAll(".city").classed("hide", false)
    }else{
        d3.selectAll(".city").classed("hide", true)
        d3.selectAll(".city." + m).classed("hide", false)
    }
})