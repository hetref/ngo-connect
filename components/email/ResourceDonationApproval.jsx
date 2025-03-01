import {
  Body,
  Button,
  Container,
  Column,
  Head,
  Heading,
  Html,
  Img,
  Preview,
  Row,
  Section,
  Text,
} from "@react-email/components";
import * as React from "react";

export const ResourceDonationApproval = ({
  donorName,
  donorPhone,
  donorEmail,
  resource,
  quantity,
  donationApprovalId,
  ngoName,
  donatedOn,
  donationApprovalLink,
}) => {
  return (
    <Html>
      <Head />
      <Preview>Resource Donation Confirmation | NGO Connect</Preview>
      <Body style={main}>
        <Container>
          <Section style={content}>
            <Row style={{ ...boxInfos, paddingBottom: "0" }}>
              <Column>
                <Heading
                  style={{
                    fontSize: 32,
                    fontWeight: "bold",
                    textAlign: "center",
                  }}
                >
                  Hi {donorName},
                </Heading>
                <Heading
                  as="h2"
                  style={{
                    fontSize: 26,
                    fontWeight: "bold",
                    textAlign: "center",
                  }}
                >
                  Please verify your resource donation to {ngoName}.
                </Heading>

                <Text style={paragraph}>
                  <b>Resource Type: </b> {resource}
                </Text>
                <Text style={{ ...paragraph, marginTop: -5 }}>
                  <b>Quantity: </b> {quantity}
                </Text>
                <Text style={{ ...paragraph, marginTop: -5 }}>
                  <b>Donor Phone:</b> {donorPhone}
                </Text>
                <Text style={{ ...paragraph, marginTop: -5 }}>
                  <b>Donor Email:</b> {donorEmail}
                </Text>
                <Text style={paragraph}>
                  <b>Donated On: </b> {new Date(donatedOn).toLocaleString()}
                </Text>
                <Text style={{ ...paragraph, marginTop: -5 }}>
                  <b>NGO Name:</b> {ngoName}
                </Text>
                <Text style={{ ...paragraph, marginTop: -5 }}>
                  <b>Confirmation ID:</b> {donationApprovalId}
                </Text>

                <Button
                  href={donationApprovalLink}
                  style={{
                    width: "100%",
                    boxSizing: "border-box",
                    padding: 12,
                    fontWeight: 600,
                    borderRadius: 8,
                    textAlign: "center",
                    backgroundColor: "rgb(79,70,229)",
                    color: "rgb(255,255,255)",
                  }}
                >
                  Verify Resource Donation
                </Button>
              </Column>
            </Row>
          </Section>

          <Text
            style={{
              textAlign: "center",
              fontSize: 12,
              color: "rgb(0,0,0, 0.7)",
            }}
          >
            © {new Date().getFullYear()} | NGO Connect | Donation Approval |
          </Text>
        </Container>
      </Body>
    </Html>
  );
};

const main = {
  backgroundColor: "#fff",
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Oxygen-Sans,Ubuntu,Cantarell,"Helvetica Neue",sans-serif',
};

const paragraph = {
  fontSize: 16,
};

const logo = {
  padding: "30px 20px",
};

const containerButton = {
  display: "flex",
  justifyContent: "center",
  width: "100%",
};

const button = {
  backgroundColor: "#e00707",
  borderRadius: 3,
  color: "#FFF",
  fontWeight: "bold",
  border: "1px solid rgb(0,0,0, 0.1)",
  cursor: "pointer",
  padding: "12px 30px",
};

const content = {
  border: "1px solid rgb(0,0,0, 0.1)",
  borderRadius: "3px",
  overflow: "hidden",
};

const image = {
  maxWidth: "100%",
};

const boxInfos = {
  padding: "20px",
};

const containerImageFooter = {
  padding: "45px 0 0 0",
};
