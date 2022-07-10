const summaryInclude = 100;

let fuseOptions = {
  includeMatches: true,
  threshold: 0.1,
  tokenize: true,
  location: 0,
  distance: 100000,
  maxPatternLength: 32,
  minMatchCharLength: 1,
  keys: [
    {name: "title", weight: 0.9},
    {name: "contents", weight: 0.8},
    {name: "tags", weight: 0.3},
    {name: "categories", weight: 0.3}
  ]
};

let fuse; 
fetch("../index.json")
  .then(resp => resp.json())
  .then(data => fuse = new Fuse(data, fuseOptions));

let searchContent = "";

async function executeSearch() {
  searchContent = $('#search-content')[0].value;
  let results = fuse.search(searchContent);
  await populateResults(results);
}

function highlight(str) { 
  return str.replace(
    new RegExp(searchContent, 'gi'),
      searchContent => `<strong><span style="background-color:yellow;">${searchContent}</span></strong>`
    );
}

async function populateResults(result){
  $('#search-results').html('')
  $.each(result, function(key, value) {
    let contents = value.item.contents;
    let snippet = "", start = 0, end = 0;
    let pos = contents.toLocaleLowerCase().indexOf(searchContent.toLocaleLowerCase());
    if (pos != -1) {
      start = pos - summaryInclude;
      end = pos + summaryInclude;
      if (start < 0) start = 0;
      if (end > contents.length) end = contents.length;
      snippet = contents.substring(start, end);
    }

    $.each(value.matches,function(k, v) {
      start = v.indices[0][0] - summaryInclude;
      end = v.indices[0][1] + summaryInclude + 1;
      if (start < 0) start = 0;
      if (end > v.value.length) end = v.value.length;
      if (pos == -1 && v.key == "contents") {
        snippet += v.value.substring(start, end);
      }
    });

    if(snippet.length < 1){
      snippet += contents.substring(0, summaryInclude * 2);
    }

    let tags = [];
    value.item.tags.forEach(t => tags.push(highlight(t)));

    let categories = [];
    value.item.categories.forEach(c => categories.push(highlight(c)));

    let template = `
    <div id="summary-${key}">
      <article style="padding: 0px" class="post">
        <header class="post-header">
          <h1 class="post-title"><a style="color:black" class="post-link" href="${value.item.permalink}">${highlight(value.item.title)}</a></h1>
          <div class="post-meta">
            <span class="post-time">${value.item.date}</span>
            <div class="post-category"><a href="/categories/${value.item.categories}/"> ${categories} </a></div>
          </div>
        </header>
        
        <div class="post-content">
          <div class="post-summary">
            ${highlight(snippet)}
            <a href="${value.item.permalink}" class="read-more-link">Read more...</a>
          </div>
          <footer class="post-footer">
            <div class="post-tags">
              <a href="/tags/${value.item.tags}">${tags}</a>
            </div>
          </footer>
        </div>
      </article>
    </div>`
    $('#search-results').append(template);
  });
}