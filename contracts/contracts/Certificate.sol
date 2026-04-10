// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

error Certificate__ZeroAddress();
error Certificate__EmptyValue();

contract Certificate {
    struct Cert {
        string certId;
        string cid;
        address issuer;
        uint256 timestamp;
        bool valid;
    }

    mapping(address => Cert[]) private certificates;

    event CertificateIssued(
        address indexed student,
        string certId,
        string cid,
        address indexed issuer,
        uint256 timestamp
    );

    function issueCertificate(
        address student,
        string calldata certId,
        string calldata cid
    ) external {
        if (student == address(0)) {
            revert Certificate__ZeroAddress();
        }
        if (bytes(certId).length == 0 || bytes(cid).length == 0) {
            revert Certificate__EmptyValue();
        }

        certificates[student].push(
            Cert({
                certId: certId,
                cid: cid,
                issuer: msg.sender,
                timestamp: block.timestamp,
                valid: true
            })
        );

        emit CertificateIssued(student, certId, cid, msg.sender, block.timestamp);
    }

    function getCertificates(address student) external view returns (Cert[] memory) {
        return certificates[student];
    }
}
