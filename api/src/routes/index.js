const { Router } = require("express");
// Importar todos los routers;
// Ejemplo: const authRouter = require('./auth.js');
const axios = require("axios");
const { Character, Occupation, character_occuption } = require("../db.js");

const router = Router();

// Configurar los routers
// Ejemplo: router.use('/auth', authRouter);

const getApi = async () => {
  const { data } = await axios.get("https://breakingbadapi.com/api/characters");
  const info = await data.map((i) => {
    return {
      id: i.char_id,
      name: i.name,
      image: i.img,
      nickName: i.nickname,
      status: i.status,
      occupation: i.occupation.map((i) => i),
      birthday: i.birthday,
    };
  });
  return info;
};

const getDb = async () => {
  return await Character.findAll({
    include: {
      model: Occupation,
      attributes: ["name"],
      through: {
        attributes: [],
      },
    },
  });
};

const getAll = async () => {
  const apiInfo = await getApi();
  const dbInfo = await getDb();
  const allInfo = apiInfo.concat(dbInfo);
  return allInfo;
};

router.get("/characters", async (req, res) => {
  const { name } = req.query;
  const allCharacters = await getAll();
  if (name) {
    const byName = await allCharacters.filter((i) =>
      i.name.toLowerCase().includes(name.toLocaleLowerCase())
    );
    byName.length
      ? res.status(200).send(byName)
      : res.status(404).send("No hay personaje con ese nombre");
  } else {
    res.status(200).send(allCharacters);
  }
});

router.get("/character/:id", async (req, res) => {
  const { id } = req.params;
  const charactersTotal = await getAll();
  if (id) {
    let charactersId = charactersTotal.filter((e) => e.id == id);
    charactersTotal.length
      ? res.status(200).json(charactersId)
      : res.status(404).send("No se encontro un personaje con ese id");
  } else res.status(200).send(charactersTotal);
});

router.get("/occupations", async (req, res) => {
  const { data } = await axios.get("https://breakingbadapi.com/api/characters");
  const occupations = data.map((i) => i.occupation);
  const dbOccupation = occupations.flat();
  dbOccupation.forEach((i) => {
    Occupation.findOrCreate({
      where: {
        name: i,
      },
    });
  });
  const allOccupations = await Occupation.findAll();
  return res.status(200).send(allOccupations);
});

router.post("/character", async (req, res) => {
  let { name, nickName, birthday, image, status, createdInDb, occupation } =
    req.body;

  const createdCharacter = await Character.create({
    name,
    nickName,
    birthday,
    image,
    status,
    createdInDb,
  });

  const createdDb = await Occupation.findAll({
    where: {
      name: occupation,
    },
  });
  createdCharacter.addOccupation(createdDb);
  return res.status(200).send("Personaje creado con exito");
});

module.exports = router;
