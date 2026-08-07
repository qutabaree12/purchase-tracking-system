import { useState } from "react";
import { useNavigate } from "react-router-dom";

import PurchaseRequestForm from "../../components/forms/PurchaseRequestForm";

const productOptions = [
  {
    value: 1,
    label: "Ordinateur Portable",
    price: 150000,
  },
  {
    value: 2,
    label: "Imprimante Laser",
    price: 45000,
  },
  {
    value: 3,
    label: "Switch Cisco",
    price: 120000,
  },
];

export default function PurchaseRequest() {

  const navigate = useNavigate();

  const [errors] = useState({});

  const [data, setData] = useState({

    numero_da: "",
    dot: "",
    date_creation: "",
    objet: "",
    statut: "en_cours",

    lignes: []

  });

  const handleChange = (e) => {

    setData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));

  };

  const handleAddLine = () => {

    setData((prev) => ({
      ...prev,

      lignes: [

        ...prev.lignes,

        {
          produit: "",
          designation: "",
          quantite: 1,
          prix_unitaire: 0,
        },

      ],

    }));

  };

  const handleLineChange = (index, field, value) => {

    setData((prev) => {

      const lignes = [...prev.lignes];

      lignes[index] = {

        ...lignes[index],

        [field]: value,

      };

      if (field === "produit") {

        const product = productOptions.find(
          (p) => p.value === Number(value)
        );

        if (product) {

          lignes[index].designation = product.label;

          lignes[index].prix_unitaire = product.price;

        }

      }

      return {

        ...prev,

        lignes,

      };

    });

  };

  const handleRemoveLine = (index) => {

    setData((prev) => ({

      ...prev,

      lignes: prev.lignes.filter((_, i) => i !== index),

    }));

  };

  const calculateTotal = () => {

    return data.lignes.reduce(

      (sum, item) => sum + item.quantite * item.prix_unitaire,

      0

    );

  };

  const handleSubmit = (e) => {

    e.preventDefault();

    console.log(data);

  };

  return (

    <div className="max-w-5xl mx-auto space-y-6">

      <form onSubmit={handleSubmit} className="card">

        <div className="card-body space-y-6">

          <PurchaseRequestForm

            data={data}

            onChange={handleChange}

            errors={errors}

          />

          <div>

            <div className="flex justify-between items-center mb-3">

              <h2 className="text-lg font-semibold">

                Lignes de la demande

              </h2>

              <button

                type="button"

                className="btn-primary"

                onClick={handleAddLine}

              >

                + Ajouter un produit

              </button>

            </div>

            {

              data.lignes.length === 0 ? (

                <p className="text-gray-500 italic">

                  Aucun produit ajouté

                </p>

              ) : (

                <div className="space-y-3">

                  {

                    data.lignes.map((ligne, index) => (

                      <div

                        key={index}

                        className="grid grid-cols-12 gap-3 items-center bg-gray-50 rounded-lg p-3"

                      >

                        <div className="col-span-4">

                          <select

                            className="input"

                            value={ligne.produit}

                            onChange={(e) =>

                              handleLineChange(

                                index,

                                "produit",

                                e.target.value

                              )

                            }

                          >

                            <option value="">

                              Sélectionner

                            </option>

                            {

                              productOptions.map((p) => (

                                <option

                                  key={p.value}

                                  value={p.value}

                                >

                                  {p.label}

                                </option>

                              ))

                            }

                          </select>

                        </div>

                        <div className="col-span-3">

                          <input

                            className="input"

                            readOnly

                            value={ligne.designation}

                          />

                        </div>

                        <div className="col-span-2">

                          <input

                            type="number"

                            className="input"

                            value={ligne.quantite}

                            onChange={(e) =>

                              handleLineChange(

                                index,

                                "quantite",

                                Number(e.target.value)

                              )

                            }

                          />

                        </div>

                        <div className="col-span-2">

                          <input

                            className="input"

                            readOnly

                            value={ligne.prix_unitaire}

                          />

                        </div>

                        <div className="col-span-1 text-center">

                          <button

                            type="button"

                            className="text-red-500"

                            onClick={() =>

                              handleRemoveLine(index)

                            }

                          >

                            ✕

                          </button>

                        </div>

                      </div>

                    ))

                  }

                </div>

              )

            }

            {

              data.lignes.length > 0 && (

                <div className="text-right mt-5 font-semibold text-lg">

                  Total :

                  {" "}

                  {calculateTotal().toLocaleString()}

                  {" "}

                  DZD

                </div>

              )

            }

          </div>

          <div className="flex justify-end gap-3">

            <button

              type="button"

              className="btn-secondary"

              onClick={() => navigate("/purchases/requests")}

            >

              Annuler

            </button>

            <button

              type="submit"

              className="btn-primary"

            >

              Enregistrer

            </button>

          </div>

        </div>

      </form>

    </div>

  );

}