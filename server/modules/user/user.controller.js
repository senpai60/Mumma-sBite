import * as userService from "./user.service.js";

// GET /users/me
export const getMe = async (req, res, next) => {
  try {
    const user = await userService.getUserById(req.user.id);

    return res.status(200).json({
      success: true,
      user,
    });
  } catch (err) {
    next(err);
  }
};

// PATCH /users/me
export const updateMe = async (req, res, next) => {
  try {
    const user = await userService.updateUserById(req.user.id, req.body);

    return res.status(200).json({
      success: true,
      message: "Profile updated",
      user,
    });
  } catch (err) {
    next(err);
  }
};
