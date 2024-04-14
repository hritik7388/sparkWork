const axios = require('axios');
const qs = require('qs');

// Function to retrieve Instagram feeds using the provided access token.
exports.getAllFeeds = async (accesstoken) => {
    let config = {
        method: 'get',
        maxBodyLength: Infinity,
        url: `https://graph.instagram.com/me/media?fields=id,caption,media_url,media_type,is_shared_to_feed,permalink,thumbnail_url,timestamp,username&access_token=${accesstoken}`,
        headers: {
            'Cookie': 'csrftoken=L3EDGJPZGJVKn8mmdW4tc22CyerEs81n; ig_did=454E0CF9-262E-4999-90B8-577A61EE6E4B; ig_nrcb=1; mid=ZSZ6RgAEAAGVL-hRsLoBQGasgSb-'
        }
    }
    const result = await axios.request(config)
        .then((response) => {
            console.log(JSON.stringify(response.data));
            return response.data;
        })
        .catch((error) => {
            console.log(error);
            return error;
        });

    return result;
}

//get the instgram auth token
exports.getToken = async (validatedBody) => {
    try {
        let data = qs.stringify({
            'client_id': validatedBody.client_id,
            'client_secret': validatedBody.client_secret,
            'grant_type': validatedBody.grant_type,
            'redirect_uri': validatedBody.redirectUri,
            'code': validatedBody.accessTokenInsta
        });

        let config = {
            method: 'post',
            maxBodyLength: Infinity,
            url: 'https://api.instagram.com/oauth/access_token',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Cookie': 'csrftoken=11U7W72Zn32ovZfUtC8mVeLBW2O9SszM; ig_did=F7B5D396-00B8-4C1F-95FA-118F6BE06911; ig_nrcb=1; mid=ZUUJAAAEAAGTRqSmwdKA0YZtAHdB'
            },
            data: data
        };

        const response = await axios.request(config);
        return response.data.access_token.replace(/"/g, '');
    } catch (error) {
        console.log(error);
        throw error; // rethrow the error to handle it outside
    }
}

// Function to retrieve Instagram account details using the provided access token.
exports.getAccountDetails = async (accesstoken) => {
    let config = {
        method: 'get',
        maxBodyLength: Infinity,
        url: `https://graph.instagram.com/v12.0/me?fields=id,username,account_type,media_count,ig_id&access_token=${accesstoken}`,
        headers: {
            'Cookie': 'csrftoken=L3EDGJPZGJVKn8mmdW4tc22CyerEs81n; ig_did=454E0CF9-262E-4999-90B8-577A61EE6E4B; ig_nrcb=1; mid=ZSZ6RgAEAAGVL-hRsLoBQGasgSb-'
        }
    };
    const result = await axios.request(config)
        .then((response) => {
            console.log(JSON.stringify(response.data));
            return response.data;
        })

        .catch((error) => {
            console.log(error);
            return error;
        });

    return result;
}

// Converts an Instagram image URL to base64.
exports.instaGramImageURLConvertToBase64 = async (imageUrl) => {
    const result = await axios({
        url: imageUrl,
        method: 'GET',
        responseType: 'arraybuffer',
    })
        .then(response => {
            const base64Image = Buffer.from(response.data, 'binary').toString('base64');
            return `data:image/jpeg;base64,${base64Image}`;
        })
        .catch(error => {
            console.error("Failed to fetch and convert the image:", error);
            return error;
        });

    return result;
}

//get page token
exports.getThePageToken = async (validatedBody) => {
    try {
        let data = qs.stringify({
            'instaUserId': validatedBody.instaUserId,
            'access_token': validatedBody.access_token,
        });

        let config = {
            method: 'get',
            maxBodyLength: Infinity,
            url: `https://graph.facebook.com/${validatedBody.instaUserId}/accounts?access_token=${validatedBody.access_token}`,
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Cookie': 'csrftoken=11U7W72Zn32ovZfUtC8mVeLBW2O9SszM; ig_did=F7B5D396-00B8-4C1F-95FA-118F6BE06911; ig_nrcb=1; mid=ZUUJAAAEAAGTRqSmwdKA0YZtAHdB'
            },
            data: data
        };
        const response = await axios.request(config);
        // return response.data.access_token.replace(/"/g, '');
        return response.data;
    } catch (error) {
        console.log(error);
        throw error;
    }
}

//upload the post 
exports.uploadThePost = async (getInstaUserId, caption, accessTokenInsta, image_url) => {
    try {
        let config = {
            method: 'post',
            maxBodyLength: Infinity,
            url: `https://graph.facebook.com/v18.0/${getInstaUserId}/media?caption=${caption}&access_token=${accessTokenInsta}&image_url=${image_url}`,
            headers: {
                'User-Agent': 'Postman/InstagramCollection'
            }
        };
        const response = await axios.request(config);
        return response.data;
    } catch (error) {
        console.log(error);
        throw error;
    }
}
exports.publishPost = async (getInstaUserId, uploadPostCreationId, accessTokenInsta) => {
    try {
        let config = {
            method: 'post',
            maxBodyLength: Infinity,
            url: `https://graph.facebook.com/v18.0/${getInstaUserId}/media_publish?creation_id=${uploadPostCreationId}&access_token=${accessTokenInsta}`,
            headers: {
                'User-Agent': 'Postman/InstagramCollection'
            }
        };
        const response = await axios.request(config);
        return response.data;
    } catch (error) {
        console.log(error);
        throw error;
    }
}

exports.uploadAndPublishPost = async (getInstaUserId, image_url, caption, accessTokenInsta) => {
    try {
        // Step 1: Upload the post
        const uploadConfig = {
            method: 'post',
            maxBodyLength: Infinity,
            // url: `https://graph.facebook.com/v18.0/${getInstaUserId}/media?caption=${caption}&access_token=${accessTokenInsta}&image_url=${image_url}`,
            url: `https://graph.facebook.com/v18.0/${getInstaUserId}/media?image_url=${image_url}&caption=${caption}&access_token=${accessTokenInsta}`,
            headers: {
                'User-Agent': 'Postman/InstagramCollection'
            }
        };
        const uploadResponse = await axios.request(uploadConfig);

        // Extract creation_id from the upload response
        const uploadPostCreationId = uploadResponse.data.id;

        // Step 2: Publish the post
        const publishConfig = {
            method: 'post',
            maxBodyLength: Infinity,
            url: `https://graph.facebook.com/v18.0/${getInstaUserId}/media_publish?creation_id=${uploadPostCreationId}&access_token=${accessTokenInsta}`,
            headers: {
                'User-Agent': 'Postman/InstagramCollection'
            }
        };
        const publishResponse = await axios.request(publishConfig);

        return { uploadResponse: uploadResponse.data, publishResponse: publishResponse.data };
    } catch (error) {
        console.log(error);
        throw error;
    }
}


//get the live-long token
exports.getLiveToken = async (validatedBody) => {
    try {
        let config = {
            method: 'get',
            maxBodyLength: Infinity,
            url: `https://graph.facebook.com/v18.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${validatedBody.client_id}&client_secret=${validatedBody.client_secret}&fb_exchange_token=${validatedBody.fb_exchange_token}`,
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
        };
        const response = await axios.request(config);
        if (response.status === 200) {
            const accessToken = response.data.access_token;
            return accessToken;
        } else {
            throw new Error(`Request failed with status ${response.status}`);
        }
    } catch (error) {
        console.error('Error:', error.message);
        throw error; // rethrow the error to handle it outside
    }
}
//check token valid or not 
exports.tokenVerify = async (accessTokenInsta) => {
    try {
        let config = {
            method: 'get',
            maxBodyLength: Infinity,
            url: `https://graph.facebook.com/debug_token?input_token=${accessTokenInsta}&access_token=${accessTokenInsta}`,
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
        };

        const response = await axios.request(config);

        if (response.status === 200) {
            const accessToken = response.data;
            return accessToken;
        } else {
            throw new Error(`Request failed with status ${response.status}`);
        }
    } catch (error) {
        console.error('Error:', error.message);

        // Handle specific error cases
        if (error.response) {
            // The request was made and the server responded with a status code
            // that falls out of the range of 2xx
            console.error('Response data:', error.response.data);
            console.error('Response status:', error.response.status);
            console.error('Response headers:', error.response.headers);
        } else if (error.request) {
            // The request was made but no response was received
            console.error('No response received:', error.request);
        } else {
            // Something happened in setting up the request that triggered an Error
            console.error('Error message:', error.message);
        }

        // You can throw a custom error or return a specific error message
        // throw new Error('Token verification failed');
        return { error: 'Token verification failed' };
    }
};

//get instgramUserID
exports.getthefollowerCount = async (accessTokenInsta, getInstaUserId) => {
    try {
        let config = {
            method: 'get',
            maxBodyLength: Infinity,
            url: `https://graph.facebook.com/v18.0/${getInstaUserId}?fields=biography%2Cusername%2Cwebsite%2Cfollowers_count%2Cfollows_count%2Cig_id%2Cmedia_count&access_token=${accessTokenInsta}`,
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
        };

        const response = await axios.request(config);

        if (response.status === 200) {
            const followerCountData = response.data;
            return followerCountData;
        } else {
            console.error('Error: Request failed with status', response.status);
            return { status: false, message: "Something went wrong" };
        }
    } catch (error) {
        console.error('Error:', error.message);

        // Handle specific error cases
        if (error.response) {
            // The request was made and the server responded with a status code
            // that falls out of the range of 2xx
            console.error('Response data:', error.response.data);
            console.error('Response status:', error.response.status);
            console.error('Response headers:', error.response.headers);
        } else if (error.request) {
            // The request was made but no response was received
            console.error('No response received:', error.request);
        } else {
            // Something happened in setting up the request that triggered an Error
            console.error('Error message:', error.message);
        }

        return { status: false, message: "Something went wrong" };
    }
};


//get the instagram follower count & profile 
exports.getInstaUserId = async (accessTokenInsta) => {
    try {
        let config = {
            method: 'get',
            maxBodyLength: Infinity,
            url: `https://graph.facebook.com/v18.0/me/accounts?fields=name%2Caccess_token%2Cinstagram_business_account&access_token=${accessTokenInsta}`,
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
        };
        const response = await axios.request(config);
        if (response.status === 200) {
            const accessToken = response.data;
            return accessToken;
        } else {
            throw new Error(`Request failed with status ${response.status}`);
        }
    } catch (error) {
        console.error('Error:', error.message);
        throw error;
    }
}

//get the instagram post 

exports.getInstamedia = async (accessTokenInsta, getInstaUserId , pagination , limit) => {
    try {
        let config = {
            method: 'get',
            maxBodyLength: Infinity,
            url: `https://graph.facebook.com/v18.0/${getInstaUserId}/media?fields=id%2Cmedia_type%2Cmedia_url%2Ctimestamp%2Ccaption%2Clike_count%2Ccomments_count%2Cusername&access_token=${accessTokenInsta}&Edges=insights%2Ccomments${pagination ? pagination : ''}&limit=${limit}`,
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
        };
        const response = await axios.request(config);
        if (response.status === 200) {
            const accessToken = response.data;
            return accessToken;
        } else {
            throw new Error(`Request failed with status ${response.status}`);
        }
    } catch (error) {
        console.error('Error:', error.message);
        if (error.response) {
            console.error('Response data:', error.response.data);
            console.error('Response status:', error.response.status);
            console.error('Response headers:', error.response.headers);
        } else if (error.request) {
            console.error('No response received:', error.request);
        } else {
            console.error('Error message:', error.message);
        }
        return { error: 'Token verification failed' };

    }
}


exports.accountEngagement = async (getInstaUserId, accessTokenInsta) => {
    try {
        let config = {
            method: 'get',
            maxBodyLength: Infinity,
            url: `https://graph.facebook.com/v18.0/${getInstaUserId}/insights?metric=accounts_engaged&period=day&metric_type=total_value&access_token=${accessTokenInsta}`,
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
        };
        const response = await axios.request(config);
        if (response.status === 200) {
            const accessToken = response.data;
            return accessToken;
        } else {
            throw new Error(`Request failed with status ${response.status}`);
        }
    } catch (error) {
        console.error('Error:', error.message);
        if (error.response) {
            console.error('Response data:', error.response.data);
            console.error('Response status:', error.response.status);
            console.error('Response headers:', error.response.headers);
        } else if (error.request) {
            console.error('No response received:', error.request);
        } else {
            console.error('Error message:', error.message);
        }
        return { error: 'Token verification failed' };

    }
}
exports.accountReach = async ( getInstaUserId,accessTokenInsta) => {
    try {
        let config = {
            method: 'get',
            maxBodyLength: Infinity,
            url: `https://graph.facebook.com/v18.0/${getInstaUserId}/insights?metric=reach&period=day&metric_type=total_value&access_token=${accessTokenInsta}`,
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
        };
        const response = await axios.request(config);
        if (response.status === 200) {
            const accessToken = response.data;
            return accessToken;
        } else {
            throw new Error(`Request failed with status ${response.status}`);
        }
    } catch (error) {
        console.error('Error:', error.message);
        if (error.response) {
            console.error('Response data:', error.response.data);
            console.error('Response status:', error.response.status);
            console.error('Response headers:', error.response.headers);
        } else if (error.request) {
            console.error('No response received:', error.request);
        } else {
            console.error('Error message:', error.message);
        }
        return { error: 'Token verification failed' };

    }
}

