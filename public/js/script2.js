const movieLinks = document.querySelectorAll("a");

for (i = 0; i < movieLinks.length; i++){
  movieLinks[i].addEventListener("click", displayMovieInfo);
}

async function displayMovieInfo() {
  let movieId = this.id;
  let url = `/api/movies/${movieId}`;
  let response = await fetch(url);
  let data = await response.json();

  document.querySelector("#movieName").innerHTML = data[0].title;
  document.querySelector("#movieYear").innerHTML = `Year: ${data[0].year}`;
  document.querySelector("#moviePicture").innerHTML = `<img src = '${data[0].poster}' width = '200'> <br>`;
  document.querySelector("#movieDesc").innerHTML = data[0].description;
  document.querySelector("#movieGenre").innerHTML = `Genre: ${data[0].genre}`;
  document.querySelector("#movieRating").innerHTML =  `Rated: ${data[0].rated}`;

  const myModal = new bootstrap.Modal(document.getElementById('movieModal'));
  
  myModal.show();
}