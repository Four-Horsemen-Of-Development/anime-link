let str = "Saturdays at 00:30 (JST)";
str = str.split(" ")[0].slice(0, -1).toUpperCase();

console.log(str);
