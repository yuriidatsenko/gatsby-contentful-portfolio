"use strict";
const pulumi = require("@pulumi/pulumi");
const aws = require ("@pulumi/aws");
const awsx = require("@pulumi/awsx");

const bucket = new aws.s3.Bucket("static-website-ALPACKED",
{
    acl: "public-read",
    website: {
        indexDocument: "index.html",
        errorDocument: "404.html",
    },
});

const bucketPolicy = new aws.s3.BucketPolicy("bucketPolicy", {
    bucket: bucket.id,
    policy: pulumi.all([bucket.arn, bucket.arn]).apply(([bucketArn, bucketArn1]) => JSON.stringify({
        Version: "2012-10-17",
        Id: "MYBUCKETPOLICY",
        Statement: [{
            Sid: "PublicReadGetObject",
            Effect: "Allow",
            Principal: "*",
            Action: "s3:GetObject",
            Resource: `${bucketArn1}/*`,
        }],
    })),
});



exports.bucketName = bucket.id;

const tenMinutes = 60 * 10;

const s3OriginId = "myS3Origin";
const cdn = new aws.cloudfront.Distribution("s3Distribution", {
    origins: [{
        domainName: bucket.bucketRegionalDomainName,
        originId: s3OriginId,
    }],
    enabled: true,
    defaultRootObject: "index.html",

    defaultCacheBehavior: {
        allowedMethods: [
            "GET",
            "HEAD",
	     "POST",
        ],
        cachedMethods: [
            "GET",
            "HEAD",
            "POST",
        ],
        targetOriginId: s3OriginId,
        forwardedValues: {
            queryString: false,
            cookies: {
                forward: "none",
            },
        },
        viewerProtocolPolicy: "https-only",
        minTtl: 0,
        defaultTtl: tenMinutes,
        maxTtl: tenMinutes,
    },
    restrictions: {
        geoRestriction: {
            restrictionType: "none",
        },
    },
    priceClass: "PriceClass_100",
    viewerCertificate: {
        cloudfrontDefaultCertificate: true,
    },
});

