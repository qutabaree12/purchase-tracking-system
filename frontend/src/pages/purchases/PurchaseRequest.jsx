import { useState, useEffect } from "react";  // useEffect ajouté
import { useNavigate, useParams } from "react-router-dom";  // useParams ajouté
import api from "../../services/api";

import PurchaseRequestForm from "../../components/forms/PurchaseRequestForm";


export default function PurchaseRequest() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = Boolean(id);

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(isEditMode);
  const [submitting, setSubmitting] = useState(false);
  const [productOptions, setProductOptions] = useState([]);

  const [data, setData] = useState({
    numero_da: "",
    dot: "",
    date_creation: "",
    objet: "",
    statut: "en_cours",
    lignes: []
  });

  // PREMIER useEffect : charge les produits, se lance TOUJOURS (création ET édition)
  useEffect(() => {
    api.get('/produits/')
      .then((res) => {
        const options = res.data.map((p) => ({
          value: p.num_produit,
          label: p.nom_produit,
          price: Number(p.prix_unit),
        }));
        setProductOptions(options);
      })
      .catch((err) => console.error(err));
  }, []);

  // DEUXIÈME useEffect : charge la DA existante, seulement en mode édition
  useEffect(() => {
    if (!isEditMode) return;

    api.get(`/demandes/${id}/`)
      .then((res) => {
        const demande = res.data;
        setData({
          numero_da: demande.numero_da,
          dot: demande.dot || "",
          date_creation: demande.date_creation,
          objet: demande.objet,
          statut: demande.statut,
          lignes: demande.lignes.map((l) => ({
            produit: l.id_produit,
            designation: l.designation,
            quantite: l.qte,
            prix_unitaire: l.prix_unit,
          })),
        });
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [id, isEditMode]);

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
      (sum, item) => sum + Number(item.quantite) * Number(item.prix_unitaire),
      0
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;

    // AJOUT : validations avant tout envoi
    const newErrors = {};
    if (data.lignes.length === 0) {
      newErrors.lignes = "Ajoutez au moins un produit.";
    } else if (data.lignes.some((l) => !l.produit)) {
      newErrors.lignes = "Sélectionnez un produit pour chaque ligne ajoutée.";
    }
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    setErrors({});

  setSubmitting(true);
    const payload = {
      dot: data.dot,
      date_creation: data.date_creation,
      objet: data.objet,
      lignes: data.lignes.map((ligne) => ({
        id_produit: Number(ligne.produit),
        designation: ligne.designation,
        qte: Number(ligne.quantite),
        prix_unit: Number(ligne.prix_unitaire),
      })),
    };

    try {
      if (isEditMode) {
        await api.patch(`/demandes/${id}/`, payload);
      } else {
        await api.post('/demandes/', payload);
      }
      navigate('/purchases/requests');
    } catch (err) {
      console.error(err.response?.data || err);
      setSubmitting(false);  // AJOUT : réactive le bouton si erreur (sinon on reste bloqué)
    }
  };

  //affichage pendant le chargement en mode édition
  if (loading) {
    return <div className="text-center py-12 text-gray-500">Chargement...</div>;
  }


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
              <h2 className="text-lg font-semibold">Lignes de la demande</h2>
              <button type="button" className="btn-primary" onClick={handleAddLine}>
                + Ajouter un produit
              </button>
            </div>

            {/* AJOUT : affichage de l'erreur de validation des lignes */}
            {errors.lignes && (
              <p className="text-sm text-red-600 mb-3">{errors.lignes}</p>
            )}

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

            <button type="submit" className="btn-primary" disabled={submitting}>
              {submitting ? "Enregistrement..." : (isEditMode ? "Mettre à jour" : "Enregistrer")}
            </button>

          </div>

        </div>

      </form>

    </div>

  );

}