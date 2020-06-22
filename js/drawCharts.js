var pymChild = null;
var pulseData;
var h = 300,
    w = 320;

function drawGraphic(containerWidth) {
    var nest = d3.nest()
        .key(function(d){ return d.metric })
        .entries(pulseData)

    var metric = d3.select("#chart_container")
        .selectAll(".metric")
        .data(nest)
        .enter().append("div")
        .attr("class", function(d){ return(d.key == "uninsured") ? "metric " + d.key : "metric hide " + d.key})
    metric.append("div")
        .attr("class", "metricName")
        .text(function(d){ return d.key })


    var city = metric
        .selectAll(".city")
        .data(function(n){   return d3.nest()
            .key(function(o){ return o.geography })
            .entries(n.values)
        })
        .enter().append("div")
        .attr("class", function(d){
          return (d.key == "US") ?  "city " + d.key.replace(/\W/g,'_') : "city hide " + d.key.replace(/\W/g,'_')
        })

    city.append("div")
        .attr("class", "cityName")
        .text(function(d){ return d.key })

    // console.log(nest)

    var race = city
    .selectAll(".race")
    .data(function(n){
        var t = n.values.filter(function(r){ return r.race_var == "total"})
        n.values.forEach(function(nv){
            nv.total = t
        })
        // console.log(n.values)
        return d3.nest()
            .key(function(o){ return o.race_var })
            .entries(n.values)

    })
    .enter().append("div")
    .attr("class", function(d){ return "race " + d.key })

    race.append("div")
        .attr("class", "raceName")
        .text(function(d){ return d.key })

    var svg = race.append("svg").attr("width",w).attr("height",h)

   var margin = {
    top: 10,
    right: 10,
    bottom: 25,
    left: 25
    },
    width = w - margin.left - margin.right,
    height = h - margin.top - margin.bottom,
    g = svg.append("g").attr("transform", "translate(" + margin.left + "," + margin.top + ")");


    var x = d3.scaleBand()
        .rangeRound([0, width])
        .padding(0.5)
        .domain(["wk1_2","wk2_3","wk3_4"])

    var y = d3.scaleLinear()
        .domain([0,1])
        .rangeRound([height, 0]);

    g.append("g")
    .attr("transform", "translate(0," + height + ")")
    .call(d3.axisBottom(x))

    g.append("g")
    .call(d3.axisLeft(y))

    g.selectAll(".moe")
        .data(function(d){
             return d.values
        })
        .enter().append("rect")
        .attr("class", "moe chartel")
        .attr("x", function(d){
            // console.log(d)
            return x(d.week_num)
        })
        .attr("y", function(d){
            return y(+d.moe_95_ub)
        })
        .attr("width", function(d){
            return x.bandwidth()
        })
        .attr("height", function(d){
            return (+d.moe_95_lb < 0) ? y(0) -y(+d.moe_95_ub) : y(+d.moe_95_lb) - y(+d.moe_95_ub)
        })
        .classed("insig", function(d){
            return (d.sigdiff == "0")
        })


    g.selectAll(".dot")
        .data(function(d){
             return d.values
        })
        .enter().append("circle")
        .attr("class", "dot")
        .attr("cx", function(d){
            return x(d.week_num) + x.bandwidth()*.5
        })
        .attr("cy", function(d){
            return y(+d.mean)
        })
        .attr("r", 4)
        .classed("insig", function(d){
            return (d.sigdiff == "0")
        })

    var tg = g.selectAll(".tg")
        .data(function(d){
             return d.values
        })
        .enter().append("g")
        .attr("clas","tg")

    tg.selectAll(".tdot")
        .data(function(d){
            // console.log(d)
            return d.total
        })
        .enter().append("circle")
        .attr("class", "tdot chartel hide")
        .attr("cx", function(d){
            // console.log(d)
            return x(d.week_num) + x.bandwidth()*.5
        })
        .attr("cy", function(d){
            return y(+d.mean)
        })
        .attr("r", 4)
        .classed("insig", function(d){
            return (d.sigdiff == "0")
        })

    tg.selectAll(".tmoe")
        .data(function(d){
             return d.total
        })
        .enter().append("rect")
        .attr("class", "tmoe hide chartel")
        .attr("x", function(d){
            // console.log(d)
            return x(d.week_num)
        })
        .attr("y", function(d){
            return y(+d.moe_95_ub)
        })
        .attr("width", function(d){
            return x.bandwidth()
        })
        .attr("height", function(d){
            return (+d.moe_95_lb < 0 ) ? y(0) -y(+d.moe_95_ub) : y(+d.moe_95_lb) - y(+d.moe_95_ub)
        })
        .classed("insig", function(d){
            return (d.sigdiff == "0")
        })

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