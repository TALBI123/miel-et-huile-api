const name = "mohamed talbi";
console.log(
  name
    .split(" ")
    .map((elm) => elm.at(0))
    .join("").toUpperCase()
);
