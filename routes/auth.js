const router = require('express').Router();
const User = require('../model/user');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const user = require('../model/user');
const { json } = require('express');


//Авторизация, выдача токенов
router.post('/login', async (req, res) =>{ 
    let now = new Date();
    userData = {guid: req.query.guid}    
        
    try {        
        //Проверяем, есть ли актуальные Refresh token-ы по пользователю
        const getUser = await User.find({guid : userData.guid, tokenUsed: false}).
                        where('expDate').gt(now);

        //Если есть то закрываем их
        if (getUser) {
            getUser.forEach(async function(item, index, array) {
                await User.updateOne({ _id: item._id }, { $set: { expDate: now, tokenUsed: true} });
            });
        }
    
        //Получаем новые токены
        let tokens = await generateNewTokens (userData)
    
        res.json(tokens)
    
    } catch (err) {
        res.status(400).send(err);
    }
    
});

//Refresh операция на пару Access, Refresh токенов
router.post('/refresh', async (req, res) =>{ 
    let now = new Date();

    //Получаем Refresh token
    const refreshToken = req.body.refreshToken

    //Если его нету, то выдаем ошибку
    if (refreshToken==null) {
        return res.status(401).send("Refresh token not found")
    }

    //Проверяем Refresh token на валидность
    jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET, (err, user) => {
        if (err) return res.status(403).send(err) //"Refresh token is invalid")
    })

//    const salt = await bcrypt.genSalt(10);
    const hashedRefreshToken = await bcrypt.hash(refreshToken, process.env.BCRYPT_SALT);

    //Проверяем, есть ли актуальные Refresh token-ы по пользователю
    const getUser = await User.findOne({refreshToken : hashedRefreshToken, tokenUsed: false}).where('expDate').gt(now);

    if (getUser) {
            await User.updateOne({ _id: getUser._id }, { $set: { expDate: now, tokenUsed: true} });
    } else {
        res.status(403).send("Refresh token is invalid")
    }

    //Получаем новые токены
    let tokens = await generateNewTokens (getUser)

    res.json(tokens)

});

//Генерация новых токенов
async function generateNewTokens (userData) {
    let now = new Date();
    let expDate = new Date();

    //Генерируем accces и token refresh token
    const accessToken = jwt.sign({guid : userData.guid}, process.env.ACCESS_TOKEN_SECRET, {
        algorithm: "HS512",
        expiresIn: process.env.ACCESS_TOKEN_LIFE}
    )
    const refreshToken = jwt.sign({guid : userData.guid}, process.env.REFRESH_TOKEN_SECRET, {
        algorithm: "HS512", 
        expiresIn: process.env.REFRESH_TOKEN_LIFE}
    )
    //Дополняем объект userData данными пользователя 
    expDate.setDate(now.getDate() + 1);

//    const salt = await bcrypt.genSalt(10);
    const hashedRefreshToken = await bcrypt.hash(refreshToken, process.env.BCRYPT_SALT);

    newUserData = {
        guid: userData.guid,
        refreshToken: hashedRefreshToken,
        creDate: now,
        expDate: expDate,
        tokenUsed: false
    
    }

    //Сохраняем в базу новый Refresh token
    const user  = new User (newUserData)
    await user.save();

    return { accessToken: accessToken, refreshToken: refreshToken}
}



module.exports = router;