import { Product } from "../models/productModel.js";
import { Cart } from "../models/cartModel.js";

//GET CART
export const getCart = async (req, res) => {
  try {
    //would get from the middleware
    const userId = req.id;

    const cart = await Cart.findOne({ userId }).populate("items.productId");
    if (!cart) {
      return res.json({
        success: true,
        cart: [],
      });
    }
    res.status(200).json({
      success: true,
      cart,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

//ADD TO CART
export const addToCart = async (req, res) => {
  try {
    const userId = req.id;
    const { productId } = req.body;

    //check if product exists or not
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    //find user's cart if it exists
    let cart = await Cart.findOne({ userId });

    //if cart doesn't exist, create a new cart
    if (!cart) {
      cart = new Cart({
        userId,
        items: [{ productId, quantity: 1, price: product.productPrice }],
        totalPrice: product.productPrice,
      });
    } else {
      //Find if the product already exists in the cart
      const itemIndex = cart.items.findIndex(
        (item) => item.productId.toString() === productId,
      );
      if (itemIndex > -1) {
        //if product exists in the cart, update the quantity and price
        cart.items[itemIndex].quantity += 1;
      } else {
        //if product doesn't exist in the cart, add the product to the cart
        cart.items.push({
          productId,
          quantity: 1,
          price: product.productPrice,
        });
      }

      //Recalculate the total price of the cart
      cart.totalPrice = cart.items.reduce(
        (total, item) => total + item.quantity * item.price,
        0,
      );
    }

    //Save the cart
    await cart.save();

    //populate the product details before sending the response
    const populatedCart = await Cart.findById(cart._id).populate(
      "items.productId",
    );

    res.status(200).json({
      success: true,
      message: "Product added to cart successfully",
      cart: populatedCart,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

//UPDATE THE QTY IN CART
export const updateQuantity = async (req, res) => {
  try {
    const userId = req.id;
    const { productId, quantity } = req.body;

    //find cart first
    let cart = await Cart.findOne({ userId });
    if (!cart) {
      return res.status(404).json({
        success: false,
        message: "Cart not found",
      });
    }
    //check if item is in the cart
    const item = cart.items.find(
      (item) => item.productId.toString() === productId,
    );
    //if not
    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Product not found in cart",
      });
    }
    if (type === "increase") item.quantity += 1;
    if (type === "decrease" && item.quantity > 1) item.quantity -= 1;

    cart.totalPrice = cart.items.reduce(
      (total, item) => total + item.quantity * item.price,
      0,
    );

    await cart.save();
    cart = await cart.populate("items.productId");
    res.status(200).json({
      success: true,
      message: "Cart updated successfully",
      cart,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

//REMOVE FROM CART
export const removeFromCart = async (req, res) => {
  try {
    const userId = req.id;
    const { productId } = req.body;

    let cart = await Cart.findOne({ userId });
    if (!cart)
      return res.status(404).json({
        success: false,
        message: "Cart not found",
      });

    cart.items = cart.items.filter(
      (item) => item.productId.toString() !== productId,
    );
    cart.totalPrice = cart.items.reduce(
      (acc, item) => acc + item.price * item.quantity,
      0,
    );

    await cart.save();

    res.status(200).json({
      success: true,
      message: "Product removed successfully!",
      cart,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
