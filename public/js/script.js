const actorLinks = document.querySelectorAll("a");

for (let i = 0; i < actorLinks.length; i++) {
  actorLinks[i].addEventListener("click", displayActorInfo);
}

async function displayActorInfo(){
  let actorId = this.id;
  let url = `/api/actors/${actorId}`;
  let response = await fetch(url);
  let data = await response.json();

  document.querySelector("#actorName").innerHTML = data[0].name;
  document.querySelector("#actorAge").innerHTML = `Age: ${data[0].age}`;
  document.querySelector("#actorPicture").innerHTML = `<img src = '${data[0].portrait}' width = '200'> <br>`;
  document.querySelector("#actorAbout").innerHTML = data[0].about;

  const myModal = new bootstrap.Modal(document.getElementById('actorModal'));
  
  myModal.show();
}
