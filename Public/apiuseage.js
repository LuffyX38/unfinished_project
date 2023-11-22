//in work
//1] everything
const api_url =
  "https://newsapi.org/v2/everything?q=india&apiKey=79d09d8d1c3740d88b78bed931a2528a";

const removeDuplicates = (src) => {
  return src.filter((item, index) => src.indexOf(item) === index);
};

fetch(api_url)
  .then((data) => data.json())
  .then((l) => {
    let src = [];

    Object.values(l.articles).map((d) => {
      src.push(d.source.name);
    });
    console.log(removeDuplicates(src));
  });
