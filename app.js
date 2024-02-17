const express = require("express");
const expressLayouts = require("express-ejs-layouts");

const { body, validationResult, check } = require("express-validator");
const methodOverride = require("method-override");

const session = require("express-session");
const cookieParser = require("cookie-parser");
const flash = require("connect-flash");

require("./utils/db");
const Contact = require("./model/contact");

const app = express();
const port = 300;

//setup method override
app.use(methodOverride("_method"));

// gunakan ejs
app.set("view engine", "ejs");
app.use(expressLayouts);
app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));

//konfigurasi flash
app.use(cookieParser("secret"));
app.use(
  session({
    cookie: { maxAge: 6000 },
    secret: "secret",
    resave: true,
    saveUninitialized: true,
  })
);
app.use(flash());

//halman home
app.get("/", (req, res) => {
  const mahasiswa = [
    {
      nama: "Fero",
      email: "fero@gmail.com",
    },

    {
      nama: "Erik",
      email: "Erik@gmail.com",
    },

    {
      nama: "Budi",
      email: "Budi@gmail.com",
    },
  ];

  res.render("index", {
    nama: "Dimas Rifqi",
    title: "Halaman Home",
    mahasiswa,
    layout: "layouts/main-layouts",
  });
  // res.sendFile('./index.html', {root: __dirname})
});

//halaman about
app.get("/about", (req, res) => {
  res.render("about", {
    layout: "layouts/main-layouts",
    title: "Halaman About",
  });
});

//halaman contact
app.get("/contact", async (req, res) => {
  const contacts = await Contact.find();

  res.render("contact", {
    layout: "layouts/main-layouts",
    title: "Halaman Contact",
    contacts,
    msg: req.flash("msg"),
  });
});

//halaman form tambah contact
app.get("/contact/add", (req, res) => {
  res.render("add-contact", {
    title: "Form Tambah Data Contact",
    layout: "layouts/main-layouts",
  });
});

//proses tambah data contact
app.post(
  "/contact",
  [
    body("nama").custom(async (value) => {
      const duplikat = await Contact.findOne({ nama: value });

      if (duplikat) {
        throw new Error("Nama Contact Sudah Digunakan");
      }
      return true;
    }),
    check("email", "Email Tidak Valid!").isEmail(),
    check("nohp", "No HP Tidak Valid!").isMobilePhone("id-ID"),
  ],
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.render("add-contact", {
        title: "Form Tambah Data Contact",
        layout: "layouts/main-layouts",
        errors: errors.array(),
      });
    } else {
      Contact.insertMany(req.body, (error, result) => {
        //kirim flash message
        req.flash("msg", "Data Berhasil Ditambahkan");
        res.redirect("/contact");
      });
    }
  }
);

// //proses hapus contact
app.delete("/contact", (req, res) => {
  Contact.deleteOne({ nama: req.body.nama }).then((result) => {
    //kirim flash message
    req.flash("msg", "Data Berhasil Dihapus");
    res.redirect("/contact");
  });
});

//Halaman form edit data contact
app.get("/contact/edit/:nama", async (req, res) => {
  const contact = await Contact.findOne({ nama: req.params.nama });

  res.render("edit-contact", {
    title: "Form Ubah Data Contact",
    layout: "layouts/main-layouts",
    contact,
  });
});

//proses ubah data
app.put(
  "/contact",
  [
    body("nama").custom(async (value, { req }) => {
      const duplikat = await Contact.findOne({ nama: value });

      if (value !== req.body.oldNama && duplikat) {
        throw new Error("Nama Contact Sudah Digunakan");
      }
      return true;
    }),
    check("email", "Email Tidak Valid!").isEmail(),
    check("nohp", "No HP Tidak Valid!").isMobilePhone("id-ID"),
  ],
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.render("edit-contact", {
        title: "Form Ubah Data Contact",
        layout: "layouts/main-layouts",
        errors: errors.array(),
        contact: req.body,
      });
    } else {
      Contact.updateOne(
        { _id: req.body._id },
        {
          $set: {
            nama: req.body.nama,
            email: req.body.email,
            nohp: req.body.nohp,
          },
        }
      ).then((result) => {
        //kirim flash message
        req.flash("msg", "Data Contact Berhasil Diubah");
        res.redirect("/contact");
      });
    }
  }
);

//halaman detail contact
app.get("/contact/:nama", async (req, res) => {
  const contact = await Contact.findOne({ nama: req.params.nama });

  res.render("detail", {
    title: "Halaman Detail Contact",
    layout: "layouts/main-layouts",
    contact,
  });
});

app.listen(port, () => {
  console.log(`Mongo Contact App || Listening at http://localhost:${port}`);
});
